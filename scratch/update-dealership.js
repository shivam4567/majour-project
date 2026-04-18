const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDealership() {
  try {
    const dealership = await prisma.dealershipInfo.findFirst();
    
    if (dealership) {
      await prisma.dealershipInfo.update({
        where: { id: dealership.id },
        data: {
          address: "1446 Laalbaag avenue Ratlam 457001",
          phone: "+91 8770860992",
          email: "rathodshivam01032003@gmail.com",
        },
      });
      console.log("Dealership info updated successfully in database.");
    } else {
      console.log("No dealership record found to update.");
    }
  } catch (error) {
    console.error("Error updating dealership info:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDealership();
