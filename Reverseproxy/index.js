const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = 8000

const BASE_PATH = 'https://web-deployer.s3.ap-south-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy()

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    console.log(`Received request for subdomain: ${hostname}`)
    // Custom Domain - DB Query

    const resolvesTo = `${BASE_PATH}/${subdomain}`
    console.log(`Request for ${req.url} resolved to ${resolvesTo}`)
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))