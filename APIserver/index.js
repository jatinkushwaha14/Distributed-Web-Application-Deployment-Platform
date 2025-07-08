const express = require('express');
const app= express();
const { ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs');
const {generateSlug} = require ('random-word-slugs');
const { createClient } = require('redis');
const { Server } = require('socket.io');
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-13945.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 13945
    }
});

client.on('error', err => console.log('Redis Client Error', err));


const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETKEY
    }
});

const io = new Server({
    cors: {
        origin: '*'
    }
});

io.listen(3001, () => {
    console.log('Socket.io server running on port 3001');
});

io.on('connection', (socket) => {
    socket.on('subscribe', async (projectId) => {
        // console.log(`Client subscribed to project: ${projectId}`);
        // await client.connect();
        socket.join(projectId);
        socket.emit('message', { type: 'info', message: `Subscribed to project ${projectId}` });
        
        client.subscribe(projectId, (message) => {
            const data = JSON.parse(message);
            console.log(data);
            socket.emit('message', data);
        });
    })
});  

app.post('/build', async (req, res) => {
    const giturl = req.body.gitUrl; 
    // console.log('Received git URL:', giturl);
    const slug = generateSlug();
    const task = new RunTaskCommand({
        cluster: 'arn:aws:ecs:ap-south-1:390844750176:cluster/builder-cluster',
        taskDefinition: 'arn:aws:ecs:ap-south-1:390844750176:task-definition/builder-task',
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-0b5adde1192afd605', 'subnet-0b13cecc65be0380e', 'subnet-0375b844cf0e96557'],
                securityGroups: ['sg-014104546b111e2b8'],
                assignPublicIp: 'ENABLED'
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        { name: 'GIT_REPO_URL', value: giturl },
                        { name: 'PROJECT_ID', value: slug }
                    ]
                }
            ]
        }
    });
    await ecsClient.send(task)

    return res.json({ message: 'Build started', data : { slug, url:`http://${slug}.localhost:8000` } });
    
})

async function redisSubscribe() {
    await client.connect(); // REQUIRED
    console.log('Subscribing to Redis logs...');
    await client.pSubscribe('logs:*', (message, channel) => {
        const data = JSON.parse(message);
        console.log(data);
        io.to(channel.replace('logs:', '')).emit('message', data); // emits to the actual projectId
    });
}

redisSubscribe();
app.listen(3000, () => {

    console.log('API Server running on port 3000');
});