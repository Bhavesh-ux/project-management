import { Prisma } from "@prisma/client";
import { Inngest } from "inngest";
import Prisma  from "../configs/prisma.js"

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });


const syncUsercreation = inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async ({event})=>{
        const{daya} = event
        await Prisma.user.create({
            data:{
                id:data.id,
                email: data.email_addresses[0]?.email_addres,
                name: data?.frist_name + " "+ data?.last_name,
                image: data?.image_url,
            }
        })
    }
)

//ingest functon to delete user frim database 

const syncUserDeleton = inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async ({event})=>{
        const{daya} = event
        await Prisma.user.delete({
            data:{
                where:{
                    id: data.id,

                }
            }
        })
    }
)

// inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({event})=>{
        const{daya} = event
        await Prisma.user.update({
            where:{id:data.id},
            data:{
                email: data.email_addresses[0]?.email_addres,
                name: data?.frist_name + " "+ data?.last_name,
                image: data?.image_url,
            }
        })
    }
)
// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUsercreation, 
    syncUserDeleton,
    syncUserUpdation
];