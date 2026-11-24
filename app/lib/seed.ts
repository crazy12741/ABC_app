import { sql } from 'drizzle-orm';
import { db, pool } from './db';
import { user } from './auth-schema';
import {
  announcements,
  appSettings,
  menuCategories,
  menuItems,
  mysteryClues,
  pollOptions,
  polls,
} from './schema';
import { photo } from '../constants/images';

async function seed() {
  await db
    .insert(appSettings)
    .values({
      id: 1,
      openingAt: new Date('2026-12-20T18:00:00+05:30'),
      venue: 'Marine Drive',
      city: 'Kochi, Kerala',
      mysteryTitle: 'The Five-Taste Drop',
      mysteryTagline: 'Five tastes. One secret burger. The clues are already dropping.',
      mysteryImageUrl: photo.hero,
      referralReward: 'A free loaded fries for you and your friend with your first order.',
      referralRules:
        'Share your code with a friend. The referral counts once they verify their mobile number and finish registration. One reward per new customer, and self-referrals never count. Rewards are released when the club opens.',
      orderingEnabled: true,
      deliveryFeePaise: 3900,
      minOrderPaise: 19900,
      orderingNote:
        'Pickup is ready in about 20 minutes. Delivery covers Marine Drive and nearby Kochi neighbourhoods.',
    })
    .onConflictDoNothing();

  const [announcementCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(announcements);

  if (Number(announcementCount?.count ?? 0) === 0) {
    await db.insert(announcements).values([
      {
        title: 'Opening night is taking shape',
        body:
          'The grill is in, the buns are being tested, and the first service is getting close. We will confirm the final opening date here first.',
        published: true,
        pinned: true,
        publishedAt: new Date(),
      },
      {
        title: 'Mystery burger: the clues start now',
        body:
          'Our first signature build stays under wraps until opening night. Two clues are live in the Mystery tab. More drop every week.',
        published: true,
        pinned: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
      {
        title: 'You pick the menu',
        body:
          'Five polls are open: flavour, cheese, sauce, sides, and a name for the mystery burger. One vote per customer per poll.',
        published: true,
        pinned: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
      },
    ]);
  }

  const [clueCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mysteryClues);

  if (Number(clueCount?.count ?? 0) === 0) {
    await db.insert(mysteryClues).values([
      {
        clueNumber: 1,
        title: 'Clue 01: There is smoke in the room',
        body:
          'It is not a sauce. It is not a spice. Something on this burger meets real fire before it meets the bun. Watch the edges.',
        imageUrl: photo.smash,
        published: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
      },
      {
        clueNumber: 2,
        title: 'Clue 02: The crunch is not the lettuce',
        body:
          'A second texture runs through the stack, and it does not come from the salad drawer. It stays loud from the first bite to the last.',
        imageUrl: photo.stacked,
        published: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    ]);
  }

  const [pollCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(polls);

  if (Number(pollCount?.count ?? 0) === 0) {
    const seedPolls = [
      {
        question: 'Which burger flavour should lead the menu?',
        description: 'The first signature build gets the most votes.',
        showResults: true,
        options: ['Smoky BBQ', 'Classic cheeseburger', 'Spicy Nashville', 'Kerala pepper', 'Truffle mushroom'],
      },
      {
        question: 'How much cheese is enough?',
        description: 'Be honest. The kitchen is listening.',
        showResults: true,
        options: ['Single slice', 'Double slice', 'Extra molten', 'No cheese'],
      },
      {
        question: 'Pick the sauce that runs the table',
        description: 'One sauce gets a permanent spot on the line.',
        showResults: false,
        options: ['House burger sauce', 'Chipotle mayo', 'Honey mustard', 'Peri-peri', 'Garlic aioli'],
      },
      {
        question: 'Which side joins the box?',
        description: 'Every burger needs a partner.',
        showResults: false,
        options: ['Loaded fries', 'Curly fries', 'Onion rings', 'Slaw'],
      },
      {
        question: 'Name the mystery burger',
        description: 'The winning name may end up on the opening menu.',
        showResults: false,
        options: ['The Five', 'Smoke & Gold', 'Big Kerala', 'The Charcoal One'],
      },
    ];

    for (const entry of seedPolls) {
      const [created] = await db
        .insert(polls)
        .values({
          question: entry.question,
          description: entry.description,
          showResults: entry.showResults,
          status: 'open',
        })
        .returning();

      await db.insert(pollOptions).values(
        entry.options.map((label, index) => ({
          pollId: created.id,
          label,
          sortOrder: index,
        })),
      );
    }
  }

  const [menuCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(menuCategories);

  if (Number(menuCount?.count ?? 0) === 0) {
    type SeedMenuItem = {
      name: string;
      description: string;
      pricePaise: number;
      imageUrl: string;
      isVeg?: boolean;
    };
    const seedMenu: { name: string; items: SeedMenuItem[] }[] = [
      {
        name: 'Burgers',
        items: [
          {
            name: 'The Five',
            description:
              'Double smashed patty, aged cheddar, house sauce, pickles and onion on a toasted potato bun.',
            pricePaise: 32900,
            imageUrl: photo.hero,
          },
          {
            name: 'Classic Cheeseburger',
            description:
              'The straight-up original: beef patty, cheddar, lettuce, tomato and burger sauce.',
            pricePaise: 22900,
            imageUrl: photo.classic,
          },
          {
            name: 'Smoky Stack',
            description:
              'Two patties, smoked cheese, crispy onions and a deep BBQ glaze.',
            pricePaise: 29900,
            imageUrl: photo.stacked,
          },
          {
            name: 'Nashville Hot',
            description:
              'Buttermilk-fried thigh, cayenne butter, slaw and pickles. Bring a friend who can handle it.',
            pricePaise: 27900,
            imageUrl: photo.smash,
          },
        ],
      },
      {
        name: 'Sides',
        items: [
          {
            name: 'Loaded Fries',
            description: 'Skin-on fries, molten cheese, house sauce and spring onion.',
            pricePaise: 14900,
            imageUrl: photo.fries,
            isVeg: true,
          },
          {
            name: 'Peri-Peri Fries',
            description: 'Crisp fries tossed in a bright peri-peri rub.',
            pricePaise: 12900,
            imageUrl: photo.fries,
            isVeg: true,
          },
          {
            name: 'Onion Rings',
            description: 'Beer-battered rings with a smoky mayo dip.',
            pricePaise: 13900,
            imageUrl: photo.fries,
            isVeg: true,
          },
        ],
      },
      {
        name: 'Shakes & Drinks',
        items: [
          {
            name: 'Vanilla Bean Shake',
            description: 'Thick vanilla shake finished with whipped cream.',
            pricePaise: 16900,
            imageUrl: photo.feast,
            isVeg: true,
          },
          {
            name: 'Chocolate Shake',
            description: 'Dark chocolate, cold milk and a cocoa dust finish.',
            pricePaise: 17900,
            imageUrl: photo.feast,
            isVeg: true,
          },
          {
            name: 'House Lemonade',
            description: 'Fresh lime, mint and a touch of black salt.',
            pricePaise: 9900,
            imageUrl: photo.feast,
            isVeg: true,
          },
        ],
      },
    ];

    for (const [categoryIndex, category] of seedMenu.entries()) {
      const [createdCategory] = await db
        .insert(menuCategories)
        .values({ name: category.name, sortOrder: categoryIndex })
        .returning();

      await db.insert(menuItems).values(
        category.items.map((item, itemIndex) => ({
          categoryId: createdCategory.id,
          name: item.name,
          description: item.description,
          pricePaise: item.pricePaise,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg ?? false,
          available: true,
          sortOrder: itemIndex,
        })),
      );
    }
  }

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);

  console.log('Seed complete');
  console.log(`- announcements: ${announcementCount?.count ?? 0} existing`);
  console.log(`- mystery clues: ${clueCount?.count ?? 0} existing`);
  console.log(`- polls: ${pollCount?.count ?? 0} existing`);
  console.log(`- menu categories: ${menuCount?.count ?? 0} existing`);
  console.log(`- customers: ${customerCount?.count ?? 0} registered`);
}

seed()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
