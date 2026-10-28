const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      histories: { orderBy: { createdAt: 'desc' } },
      items: true,
    },
  });

  console.log(`Found ${invoices.length} recent invoices:`);
  for (const inv of invoices) {
    console.log('----------------------------------------------------');
    console.log(`Invoice: ${inv.invoiceNumber} | ID: ${inv.id}`);
    console.log(`Created: ${inv.createdAt.toISOString()} | Status: ${inv.status}`);
    console.log(`Buyer: ${inv.buyerName} | Email: ${inv.buyerEmail || '(NONE)'} | Phone: ${inv.buyerPhone || '(NONE)'}`);
    console.log(`GrandTotal: ${inv.grandTotal} | Notes: ${inv.notes}`);
    console.log(`Items: ${inv.items.map(i => i.name).join(', ')}`);
    console.log('Histories:');
    for (const h of inv.histories) {
      console.log(`  - [${h.action}] ${h.note} (${h.createdAt.toISOString()})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
