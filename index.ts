import express from 'express'
import restaurantsRouter from './routes/restaurants.js'
import cuisinesRouter from './routes/cuisiness.js'
import { errorHandler } from './middlewares/errorHandler.js'

const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())

app.use('/restaurants', restaurantsRouter)
app.use('/cuisines', cuisinesRouter)

app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`app running on ${PORT}`)
}).on('error', (err) => {
    throw new Error(err.message)
})