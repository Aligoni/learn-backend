import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { slugify } from '../common/slugify';
import { Category } from '../products/entities/category.entity';
import { Product } from '../products/entities/product.entity';

function picsumImageUrl(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/600/400`;
}

type SeedProduct = {
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
};

type SeedCategory = {
  name: string;
  description: string;
  products: SeedProduct[];
};

const CATALOG: SeedCategory[] = [
  {
    name: 'Electronics',
    description: 'Gadgets, computers, and accessories.',
    products: [
      {
        name: 'Wireless Headphones',
        description:
          'Over-ear noise-cancelling headphones with 30-hour battery and USB-C charging.',
        price: 129.99,
        stock: 120,
        rating: 4.6,
      },
      {
        name: 'USB-C Hub',
        description:
          'Seven-in-one adapter with HDMI, SD slots, and pass-through power delivery.',
        price: 49.5,
        stock: 200,
        rating: 4.3,
      },
      {
        name: '4K Monitor',
        description:
          '27-inch IPS panel, 60Hz, HDR support, ideal for design and coding.',
        price: 349.0,
        stock: 45,
        rating: 4.5,
      },
      {
        name: 'Mechanical Keyboard',
        description:
          'Hot-swappable switches, RGB backlight, compact TKL layout.',
        price: 109.0,
        stock: 80,
        rating: 4.7,
      },
      {
        name: 'Webcam Pro',
        description:
          '1080p60 stream-ready camera with dual microphones and privacy shutter.',
        price: 79.99,
        stock: 95,
        rating: 4.2,
      },
    ],
  },
  {
    name: 'Books',
    description: 'Fiction, non-fiction, and technical titles.',
    products: [
      {
        name: 'TypeScript Deep Dive',
        description:
          'In-depth guide to the TypeScript language and type system.',
        price: 39.99,
        stock: 60,
        rating: 4.8,
      },
      {
        name: 'Clean Code',
        description:
          'Principles and patterns for maintainable software craftsmanship.',
        price: 44.0,
        stock: 70,
        rating: 4.7,
      },
      {
        name: 'The Pragmatic Programmer',
        description: 'Timeless advice for developers building serious systems.',
        price: 49.99,
        stock: 55,
        rating: 4.6,
      },
      {
        name: 'Design Patterns',
        description:
          'Classic Gang of Four patterns explained with clear examples.',
        price: 54.5,
        stock: 40,
        rating: 4.5,
      },
      {
        name: 'Database Internals',
        description:
          'How storage engines work: B-trees, WAL, and distributed consensus.',
        price: 59.0,
        stock: 30,
        rating: 4.9,
      },
    ],
  },
  {
    name: 'Home & Kitchen',
    description: 'Cookware, appliances, and home essentials.',
    products: [
      {
        name: 'Stand Mixer',
        description:
          '10-speed planetary mixing with stainless bowl and dough hook.',
        price: 249.0,
        stock: 25,
        rating: 4.5,
      },
      {
        name: 'Coffee Maker',
        description: 'Programmable drip coffee machine with thermal carafe.',
        price: 89.99,
        stock: 90,
        rating: 4.2,
      },
      {
        name: 'Air Fryer',
        description:
          '5.8-quart digital air fryer with presets and easy-clean basket.',
        price: 119.0,
        stock: 65,
        rating: 4.4,
      },
      {
        name: 'Bed Sheets Set',
        description:
          'Breathable cotton sateen sheets, queen size, four-piece set.',
        price: 59.99,
        stock: 110,
        rating: 4.1,
      },
      {
        name: 'LED Desk Lamp',
        description:
          'Adjustable color temperature and brightness with USB charging port.',
        price: 34.5,
        stock: 150,
        rating: 4.3,
      },
    ],
  },
  {
    name: 'Clothing',
    description: 'Apparel and accessories for all seasons.',
    products: [
      {
        name: 'Running Shoes',
        description: 'Lightweight cushioned soles with breathable mesh upper.',
        price: 95.0,
        stock: 140,
        rating: 4.4,
      },
      {
        name: 'Denim Jacket',
        description: 'Classic fit blue denim jacket with metal buttons.',
        price: 79.0,
        stock: 75,
        rating: 4.2,
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Soft organic cotton tee available in multiple colors.',
        price: 22.0,
        stock: 300,
        rating: 4.0,
      },
      {
        name: 'Winter Coat',
        description: 'Water-resistant insulated parka with removable hood.',
        price: 189.99,
        stock: 40,
        rating: 4.5,
      },
      {
        name: 'Baseball Cap',
        description: 'Adjustable strap, curved brim, embroidered logo panel.',
        price: 18.5,
        stock: 200,
        rating: 4.1,
      },
    ],
  },
  {
    name: 'Sports',
    description: 'Gear for training, teams, and outdoor activities.',
    products: [
      {
        name: 'Yoga Mat',
        description:
          'Non-slip 6mm mat with carrying strap and alignment lines.',
        price: 35.0,
        stock: 180,
        rating: 4.3,
      },
      {
        name: 'Dumbbells Set',
        description:
          'Adjustable pair from 5 to 25 lb per hand with storage tray.',
        price: 199.0,
        stock: 35,
        rating: 4.6,
      },
      {
        name: 'Tennis Racket',
        description: 'Graphite frame, medium grip, strung for all-court play.',
        price: 129.0,
        stock: 50,
        rating: 4.4,
      },
      {
        name: 'Basketball',
        description: 'Official size 7 indoor/outdoor composite leather ball.',
        price: 29.99,
        stock: 120,
        rating: 4.2,
      },
      {
        name: 'Insulated Water Bottle',
        description: '32oz stainless steel, keeps drinks cold for 24 hours.',
        price: 32.0,
        stock: 220,
        rating: 4.5,
      },
    ],
  },
  {
    name: 'Toys',
    description: 'Games and play for kids and families.',
    products: [
      {
        name: 'Building Blocks',
        description: '200-piece colorful blocks compatible with major brands.',
        price: 42.0,
        stock: 90,
        rating: 4.6,
      },
      {
        name: 'Board Game Classic',
        description:
          'Strategy game for 2-4 players, average playtime 45 minutes.',
        price: 48.99,
        stock: 60,
        rating: 4.5,
      },
      {
        name: 'Remote Control Car',
        description:
          '1:16 scale RC car with rechargeable battery and LED headlights.',
        price: 55.0,
        stock: 70,
        rating: 4.2,
      },
      {
        name: 'Puzzle 1000 Pieces',
        description:
          'Landscape art puzzle with matte finish and poster included.',
        price: 24.99,
        stock: 100,
        rating: 4.3,
      },
      {
        name: 'Plush Bear',
        description: 'Soft teddy bear, machine washable, safe for ages 3+.',
        price: 28.0,
        stock: 150,
        rating: 4.4,
      },
    ],
  },
  {
    name: 'Beauty',
    description: 'Skincare, hair care, and personal care.',
    products: [
      {
        name: 'Face Moisturizer',
        description: 'Daily hydrating cream with SPF 30 for sensitive skin.',
        price: 26.0,
        stock: 200,
        rating: 4.3,
      },
      {
        name: 'Shampoo Set',
        description: 'Sulfate-free shampoo and conditioner duo, 12oz each.',
        price: 31.5,
        stock: 160,
        rating: 4.2,
      },
      {
        name: 'Lip Balm Pack',
        description:
          'Pack of four tinted balms with shea butter and vitamin E.',
        price: 12.99,
        stock: 400,
        rating: 4.0,
      },
      {
        name: 'Hair Dryer',
        description: 'Ionic dryer with concentrator, diffuser, and cool shot.',
        price: 59.0,
        stock: 85,
        rating: 4.4,
      },
      {
        name: 'Perfume Sample Set',
        description: 'Five travel-size vials of bestselling fragrances.',
        price: 45.0,
        stock: 55,
        rating: 4.5,
      },
    ],
  },
  {
    name: 'Garden',
    description: 'Tools and supplies for lawn and garden.',
    products: [
      {
        name: 'Garden Hose',
        description:
          '50ft expandable hose with brass fittings and spray nozzle.',
        price: 39.99,
        stock: 95,
        rating: 4.1,
      },
      {
        name: 'Plant Pot Set',
        description: 'Three ceramic pots with drainage trays, assorted sizes.',
        price: 44.0,
        stock: 70,
        rating: 4.3,
      },
      {
        name: 'Mini Lawn Mower',
        description: 'Cordless electric mower for small yards, 14-inch deck.',
        price: 279.0,
        stock: 20,
        rating: 4.4,
      },
      {
        name: 'Garden Gloves',
        description: 'Puncture-resistant gloves with reinforced fingertips.',
        price: 16.5,
        stock: 250,
        rating: 4.0,
      },
      {
        name: 'Seed Starter Kit',
        description: 'Trays, peat pellets, and humidity dome for seedlings.',
        price: 27.99,
        stock: 130,
        rating: 4.2,
      },
    ],
  },
  {
    name: 'Pet Supplies',
    description: 'Everything for dogs, cats, and small pets.',
    products: [
      {
        name: 'Dog Leash',
        description: '6ft reflective nylon leash with padded handle.',
        price: 19.99,
        stock: 300,
        rating: 4.3,
      },
      {
        name: 'Cat Tower',
        description: 'Multi-level scratching posts with perch and hideaway.',
        price: 89.0,
        stock: 40,
        rating: 4.5,
      },
      {
        name: 'Pet Food Bowl',
        description:
          'Stainless steel non-tip bowls with silicone base, set of two.',
        price: 24.0,
        stock: 180,
        rating: 4.2,
      },
      {
        name: 'Aquarium Filter',
        description:
          'Hang-on-back filter for tanks up to 50 gallons, quiet motor.',
        price: 45.5,
        stock: 60,
        rating: 4.1,
      },
      {
        name: 'Bird Feeder',
        description: 'Weather-resistant tube feeder with squirrel guard.',
        price: 33.0,
        stock: 85,
        rating: 4.0,
      },
    ],
  },
  {
    name: 'Office',
    description: 'Furniture and supplies for productive workspaces.',
    products: [
      {
        name: 'Ergonomic Chair',
        description:
          'Mesh back, lumbar support, adjustable arms and seat height.',
        price: 329.0,
        stock: 30,
        rating: 4.6,
      },
      {
        name: 'Standing Desk',
        description: 'Electric height-adjustable desk, 48x30 inch surface.',
        price: 449.99,
        stock: 22,
        rating: 4.5,
      },
      {
        name: 'Notebook Pack',
        description: 'Five ruled notebooks, 80 sheets each, acid-free paper.',
        price: 18.99,
        stock: 500,
        rating: 4.2,
      },
      {
        name: 'Whiteboard',
        description: 'Magnetic dry-erase board 36x24 with markers and eraser.',
        price: 54.0,
        stock: 75,
        rating: 4.3,
      },
      {
        name: 'Heavy Duty Stapler',
        description: 'Staples up to 50 sheets, includes starter staples.',
        price: 28.5,
        stock: 140,
        rating: 4.1,
      },
    ],
  },
];

async function seed(): Promise<void> {
  const logger = new Logger('Seed');
  const reset = process.argv.includes('--reset');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const dataSource = app.get(DataSource);
    const categoryRepo = dataSource.getRepository(Category);
    const productRepo = dataSource.getRepository(Product);

    if (reset) {
      logger.log('Resetting products and categories…');
      await productRepo.createQueryBuilder().delete().from(Product).execute();
      await categoryRepo.createQueryBuilder().delete().from(Category).execute();
    }

    let categoriesInserted = 0;
    let productsInserted = 0;

    for (const cat of CATALOG) {
      const slug = slugify(cat.name);
      let category = await categoryRepo.findOne({ where: { slug } });
      if (!category) {
        category = categoryRepo.create({
          name: cat.name,
          slug,
          description: cat.description,
        });
        await categoryRepo.save(category);
        categoriesInserted += 1;
      }

      for (const p of cat.products) {
        const productSlug = slugify(p.name);
        const existing = await productRepo.findOne({
          where: { slug: productSlug },
        });
        if (existing) {
          continue;
        }

        const product = productRepo.create({
          name: p.name,
          slug: productSlug,
          description: p.description,
          imageUrl: picsumImageUrl(productSlug),
          price: p.price,
          currency: 'USD',
          stock: p.stock,
          rating: p.rating,
          categoryId: category.id,
        });
        await productRepo.save(product);
        productsInserted += 1;
      }
    }

    const totalCategories = await categoryRepo.count();
    const totalProducts = await productRepo.count();

    logger.log(
      `Done. Categories added this run: ${categoriesInserted}, products added this run: ${productsInserted}. ` +
        `Totals in database: ${totalCategories} categories, ${totalProducts} products.`,
    );
  } finally {
    await app.close();
  }
}

void seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
