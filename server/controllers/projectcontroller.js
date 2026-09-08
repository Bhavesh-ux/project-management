import prisma from "../configs/prisma.js";
// create project

export const createProject = async ( req, res) =>{
    try {
        const {userId} = await req.auth();
        const {workspaceId, description, name, status, start_data, end_data,
            team_member, team_lead, progress, prority} = req.body;

            // check if user has admin role for workspace 
            const workspace = await prisma.workspace.findUnique({
                where:{id:workspaceId},
                include:{member: { include:{user: true}}}
            })
            if(!workspace){
                return res.status(404).json({message: "worksapce not found"});
            }
            if(!workspace.member.some((member)=>member.userId === userId && member.role === "ADMIN")){
                  return res.status(403).json({message: "You don't have permission to create prpject in this workspace"});

            }

            //Get Team Lead using email 
            const teamlead = await prisma.user.findUnique({
                where:{email: team_lead},
                select: {id: true}
            })

            const project = await prisma.project.create({
                data:{
                    workspaceId,
                    name,
                    description,
                    status,
                    priority,
                    progress,
                    team_lead: teamlead?.id,
                    start_data: start_data? new Data(start_data):null,
                    end_date: end_date? new Data(end_date):null
                }
            })

            // Add member to project if they are in the worspace
            if (team_member?.length > 0){
                const memberToADD = []
                workspace.member.forEach(member => {
                    if(team_member.include(member.user.email)){
                        memberToADD.push(member.user.id)
                    }
                })

            await prisma.projectMember.createMany({
                data: mamberToadd.mao(memberId => ({
                    projectId: project.id,
                    userId:memberId
                }))
            })
            }
        const projectWithMember = await prisma.project.findUnique({
            where: {id: project.id}, 
            include: {
                member: {include: {user: true}},
                tasks: {include: {assignee: true, comments:{include: {user:
                    true
                }}}},
                owner:true
            }
        })
        res.json({project: projectWithMember, message: "Project create successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}

//update project 
export const updateProject = async ( req, res) =>{
    try {
        const { userId } = await req.auth();
        const{id, workspaceId, description, name, status, start_data, end_date, 
            progress, priority
        } = req.body;

        //check if user has admin role for workspace
         const workspace = await prisma.workspace.findUnique({
                where:{id:workspaceId},
                include:{member: { include:{user: true}}}
         })

         if(!workspace){
            return res.status(404).json({message: "workspace not found"});
         }

         if(!workspace.member.some((mumber)=>member.userId === userID && member.role === "ADMIN")){
            const project  = await prisma.project.findUnique({
                where : {id}
            })

            if(!project){
                return res.status(404).json({message: "Project not found"});
            }
            else if(project.team_lead !== userId){
                return res.status(403).json({message: "You don't have permission to uodate project in this workspace"});

            }
         }
         const project = await prisma.project.update({
            where: {data},
            data: {
                workspaceId,
                description,
                name,
                status,
                priority,
                progress,
                start_data: start_data? new Data(start_data):null,
                end_date: end_date? new Data(end_date):null
            }
         })
         res.json({project, message : "Project updated successfully"})

    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}

//add member to project

export const addMember = async ( req, res) =>{
    try {
        const { userId} = await req.auth();
        const { projectId} = req.params;
        const{ email } = req.body;

        //check if user is project lead 
        const project = await prisma.project.findUnique({
            where: { id: projectId},
            include: { member: {include: {user: true}}}
        })
        if(!project){
            return res.status(404).json({message:"project not found"});
        }

        if(project.team_lead !== userId){
            return res.status(404).json({message:"Only project lead can add member"});
        }

        //check if user is already a memeber 
        const existingMember = project.member.find((member)=>member.email === email)

        if(existingMember){
            return res.status(404).json({message:"user is already a member"});
        }

        const user = await prisma.user.findUnique({where:{email}});
        if(!user){
            return res.status(404).json({message: "User not found "});
        }

        const member = await prisma.project.create({
            data:{
                userId: user.id,
                project
            }
        })

        res.json({member, message:" Member add successfully"})

    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}
