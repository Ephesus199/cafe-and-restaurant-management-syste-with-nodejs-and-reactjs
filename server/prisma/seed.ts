import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";


async function main() {
    console.log("Seeding database...");
    // Add your seeding logic here, for example:
    const firstUser = await prisma.user.create({
        data: {
            username: "efesonuliso",
            email: "efesonuliso2020@gmail.com",
            fullName: "Efeson Uliso",
            passwordHash: await bcrypt.hash("admin123", 10),
            role: "super_admin",
            branchId: null,
            createdBy: null,
        },
    });
    console.log("First user created:", firstUser);

    
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