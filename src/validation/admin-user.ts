import * as z from 'zod'

export const adminUserLoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
}).strict({
    message: "Bad payload present in the data"
})


export const sendNotificationToUserSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    userIds: z.array(z.string()).min(1).optional()
}).strict({
    message: "Bad payload present in the data"
})