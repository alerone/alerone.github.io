export class UserModel {
    constructor(name, birthdate) {
        this.name = name
        this.birthdate = birthdate
    }
}

export class CleaningModel {
    constructor(userList) {
        this.userList = userList
        this.tasks = ['Cocina', 'Cocina', 'Salón', 'Pasillo']
    }

    getUsers() {
        var res = ''
        this.userList.forEach((user) => {
            res += user.name + ' '
        })
        res += '\n'
        return res
    }

    getTaskOrder() {
        const week = this.getWeekOfYear()
        const mod = week % 4
        console.log(mod)

        const baseList = this.tasks
        switch (mod) {
            case 1:
                return baseList
            case 2:
                return baseList.slice().reverse()
            case 3:
                return [baseList[0], baseList[1], baseList[3], baseList[2]]
            case 0:
                return [baseList[3], baseList[2], baseList[0], baseList[1]]
            default:
                return baseList
        }
    }
    /**@param {Date} date */
    getWeekOfYear() {
        const date = new Date()
        // Creamos una copia de la fecha y la ajustamos a medianoche
        const target = new Date(date.valueOf())
        target.setHours(0, 0, 0, 0)

        // ISO-8601: el lunes es el primer día de la semana.
        // Calculamos el jueves de la semana actual
        const dayNr = (date.getDay() + 6) % 7
        target.setDate(target.getDate() - dayNr + 3)

        // Obtenemos el primer jueves del año
        const firstThursday = new Date(target.getFullYear(), 0, 4)
        const firstDayNr = (firstThursday.getDay() + 6) % 7
        firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)

        // Calculamos la diferencia en semanas
        const weekNumber = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000))
        return weekNumber
    }
}
