import { UserModel, CleaningModel } from './models.js'

const users = [
    new UserModel('Álvaro'),
    new UserModel('Rubén'),
    new UserModel('Joan'),
    new UserModel('Álex'),
]
const cleaningModel = new CleaningModel(users)
console.log(cleaningModel.getUsers(), cleaningModel.getTaskOrder())

const alvaroTask = document.querySelector('#alvaroTask')
const alexTask = document.querySelector('#alexTask')
const joanTask = document.querySelector('#joanTask')
const rubiuTask = document.querySelector('#rubiuTask')

const dayLabel = document.querySelector('#diaLabel')
const semanaLabel = document.querySelector('#semanaLabel')

const tasks = cleaningModel.getTaskOrder()

alvaroTask.textContent = tasks[1]
alexTask.textContent = tasks[3]
joanTask.textContent = tasks[2]
rubiuTask.textContent = tasks[0]

const today = new Date()

const day = String(today.getDate()).padStart(2, '0')
const month = String(today.getMonth() + 1).padStart(2, '0')
const year = today.getFullYear()

dayLabel.textContent = `DIA: ${day}/${month}/${year}`
const semana = cleaningModel.getWeekOfYear()
semanaLabel.textContent = `SEMANA: ${semana}`
