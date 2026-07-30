import prisma from "./src/config/prisma.js";

async function main() {

    console.log("🌱 Seeding database...");

    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();

    const categories = await prisma.category.createManyAndReturn({
        data: [
            { name: "Laptops" },
            { name: "Displays" },
            { name: "Accessories" },
            { name: "Storage" },
            { name: "Audio" },
            { name: "Networking" },
            { name: "Tablets" },
            { name: "Cameras" },
        ],
    });

    const suppliers = await prisma.supplier.createManyAndReturn({
        data: [
            {
                name: "Apple",
                email: "sales@apple.com",
                phone: "0100000001",
            },
            {
                name: "Dell",
                email: "sales@dell.com",
                phone: "0100000002",
            },
            {
                name: "Samsung",
                email: "sales@samsung.com",
                phone: "0100000003",
            },
            {
                name: "Sony",
                email: "sales@sony.com",
                phone: "0100000004",
            },
            {
                name: "Canon",
                email: "sales@canon.com",
                phone: "0100000005",
            },
            {
                name: "Logitech",
                email: "sales@logitech.com",
                phone: "0100000006",
            },
            {
                name: "ASUS",
                email: "sales@asus.com",
                phone: "0100000007",
            },
            {
                name: "LG",
                email: "sales@lg.com",
                phone: "0100000008",
            },
        ],
    });

    const products = [
        "MacBook Pro 16",
        "MacBook Air 15",
        "Dell XPS 15",
        "ASUS ZenBook",
        "LG UltraFine 27",
        "Samsung Odyssey G8",
        "Studio Display",
        "Magic Mouse",
        "Magic Keyboard",
        "AirPods Pro",
        "Sony WH-1000XM6",
        "Logitech MX Master 3S",
        "Logitech MX Keys",
        "Samsung T9 SSD",
        "SanDisk Extreme SSD",
        "Canon EOS R8",
        "Canon RF 50mm",
        "iPad Pro 13",
        "iPad Air",
        "Apple Pencil Pro",
        "WiFi 7 Router",
        "USB-C Dock",
        "Thunderbolt Cable",
        "Webcam Pro",
        "Mechanical Keyboard",
        "Gaming Mouse",
        "Portable Monitor",
        "USB Flash Drive",
        "External HDD",
        "Bluetooth Speaker",
    ];

    for (let i = 0; i < products.length; i++) {

        const category = categories[i % categories.length];
        const supplier = suppliers[i % suppliers.length];

        await prisma.product.create({

            data: {

                name: products[i],

                description: `${products[i]} description`,

                sku: `SKU-${String(i + 1).padStart(4, "0")}`,

                price: (499 + (i * 137)).toFixed(2),

                stock: 5 + (i * 3),

                categoryId: category.id,

                supplierId: supplier.id,

            },

        });

    }

    console.log("✅ Database seeded.");

}

main()
    .catch((error) => {

        console.error(error);

        process.exit(1);

    })
    .finally(async () => {

        await prisma.$disconnect();

    });