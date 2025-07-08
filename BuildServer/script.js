const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const mime = require('mime-types')
const { createClient } = require( 'redis');
require('dotenv').config();

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-13945.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 13945
    }
});

client.on('error', err => console.log('Redis Client Error', err));




const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETKEY
    }
})

const PROJECT_ID = process.env.PROJECT_ID

async function publishLog(message) {
    const channel = `logs:${PROJECT_ID}`;
    await client.publish(channel, JSON.stringify({ message: `*** ${message} ***` }));
}

async function init() {
    await client.connect();
    console.log('Executing script.js')
    await publishLog('Build Started');

    const outDirPath = path.join(__dirname, 'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    p.stdout.on('data', async function (data) {
        console.log(data.toString())
        await publishLog(data.toString())
    })

    p.stdout.on('error', async function (data) {
        console.log('Error', data.toString())
        await publishLog(`error: ${data.toString()}`)
    })

    p.on('close', async function () {
        console.log('Build Complete')
        await publishLog(`Build Complete`)
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })

        await publishLog(`Starting to upload`)
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath)
            await publishLog(`uploading ${file}`)

            const command = new PutObjectCommand({
                Bucket: 'web-deployer',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command)
            await publishLog(`uploaded ${file}`)
            console.log('uploaded', filePath)
        }
        await publishLog(`Done`)
        console.log('Done...')
    })
}

init()