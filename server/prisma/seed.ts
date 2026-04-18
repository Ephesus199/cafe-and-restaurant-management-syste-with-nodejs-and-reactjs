import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";


async function main() {
    // first delete existing data to avoid conflicts
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    console.log("Seeding database...");
    // Add your seeding logic here, for example:
    const firstUser = await prisma.user.create({
        data: {
            username: "efesonuliso",
            email: "efesonuliso2020@gmail.com",
            fullName: "Efeson Uliso",
            passwordHash: await bcrypt.hash("12345678", 12),
            role: "super_admin",
            branchId: null,
            createdBy: null,
        },
    });


    console.log("First user created:", firstUser);

    const branches = await prisma.branch.createMany({
        data: [
             {
               name: "Main Branch",
                branchCode: "MAIN",
               address: "123 Main St",
                phone: "123-456-7890",
                country: "USA",
                email: "main@branch.com",
               postalCode: "12345",
                
            }, 
            {
                name: "Secondary Branch",
                branchCode: "SEC",
                address: "456 Secondary St",
                phone: "987-654-3210",
                country: "USA",
                email: "secondar@branch.com",
                postalCode: "54321",
             
            },
        ],
    });

    
}

main()
    .then(() => {
        console.log("Seeding completed.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error seeding database:", error);
        process.exit(1);
    });