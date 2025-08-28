import { generateHashPassword } from "../../utils/password";
import { db } from "../connection";
import { ourPartnersTable } from "../schema";
import { trainingTable } from "../schema/training";
import { adminTable, instructorTable, userTable } from "../schema/users";

async function addUser() {
  const pwd = await generateHashPassword("sometpaswd");
  const xc = await db
    .insert(userTable)
    .values({
      email: "something@gmail.com",
      firstName: "SSS",
      mobile: "9371828430",
      hash: pwd.hash,
      salt: pwd.salt,
    })
    .returning();
  console.log("🚀 ~ xc ~ x:", xc);
}

async function addAdmin() {
  const pwd = await generateHashPassword("this_is@admins4s");
  return await db
    .insert(adminTable)
    .values({
      email: "main.admin@s4s.com",
      firstName: "Sakthi",
      mobile: "9382383901",
      ...pwd,
    })
    .returning();
}

async function addInstructors(verifiedBy: string) {
  const pwd = await generateHashPassword("instruCtor@0922");
  return await db
    .insert(instructorTable)
    .values([
      {
        email: "test_instructor@s4s.com",
        firstName: "Mathesh",
        lastName: "Boopathy",
        mobile: "8765432102",
        institutionName: "Sairam",
        ...pwd,
        approvedBy: verifiedBy,
      },
    ])
    .returning();
}

async function addTrainings() {
  const trainings = await db.insert(trainingTable).values([
    {
      title: "Importance of kindness",
      coverImg: "https://example.com/image1.jpg",
      location: "Chennai",
      cost: "300.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "1-day training for kindness propagation",
      durationType: "Days",
      durationValue: 1,
      startDate: new Date("2024-12-05"),
      endDate: new Date("2024-12-06"),
      link: "https://dummylink.com",
    },
    {
      title: "Leadership and Empathy",
      coverImg: "https://example.com/image2.jpg",
      location: "Bangalore",
      cost: "500.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "3-day workshop on leadership through empathy",
      durationType: "Days",
      durationValue: 3,
      startDate: new Date("2024-12-10"),
      endDate: new Date("2024-12-13"),
      link: "https://dummylink2.com",
    },
    {
      title: "Stress Management 101",
      coverImg: "https://example.com/image3.jpg",
      location: "Mumbai",
      cost: "250.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "Half-day session on managing stress effectively",
      durationType: "Hours",
      durationValue: 4,
      startDate: new Date("2024-12-15"),
      endDate: new Date("2024-12-15"),
      link: "https://dummylink3.com",
    },
    {
      title: "Mindfulness Practices",
      coverImg: "https://example.com/image4.jpg",
      location: "Hyderabad",
      cost: "400.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description:
        "2-day training on incorporating mindfulness into daily life",
      durationType: "Days",
      durationValue: 2,
      startDate: new Date("2024-12-18"),
      endDate: new Date("2024-12-20"),
      link: "https://dummylink4.com",
    },
    {
      title: "Conflict Resolution Strategies",
      coverImg: "https://example.com/image5.jpg",
      location: "Delhi",
      cost: "600.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "Interactive 2-day workshop on resolving conflicts",
      durationType: "Days",
      durationValue: 2,
      startDate: new Date("2024-12-25"),
      endDate: new Date("2024-12-27"),
      link: "https://dummylink5.com",
    },
    {
      title: "Kindness in Action",
      coverImg: "https://example.com/image1.jpg",
      location: "Chennai",
      cost: "300.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "A 1-day training session to inspire acts of kindness.",
      durationType: "Days",
      durationValue: 1,
      startDate: new Date("2025-01-05"),
      endDate: new Date("2025-01-05"),
      link: "https://dummylink1.com",
    },
    {
      title: "Empathy as a Leadership Tool",
      coverImg: "https://example.com/image2.jpg",
      location: "Bangalore",
      cost: "450.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "A 2-day workshop focusing on empathy in leadership.",
      durationType: "Days",
      durationValue: 2,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-01-16"),
      link: "https://dummylink2.com",
    },
    {
      title: "Stress Relief for Professionals",
      coverImg: "https://example.com/image3.jpg",
      location: "Mumbai",
      cost: "350.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "A practical 1-day session on managing workplace stress.",
      durationType: "Days",
      durationValue: 1,
      startDate: new Date("2025-01-25"),
      endDate: new Date("2025-01-25"),
      link: "https://dummylink3.com",
    },
    {
      title: "Mindfulness for Busy Lives",
      coverImg: "https://example.com/image4.jpg",
      location: "Hyderabad",
      cost: "500.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "Learn mindfulness techniques to improve focus and calm.",
      durationType: "Days",
      durationValue: 3,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-03"),
      link: "https://dummylink4.com",
    },
    {
      title: "Conflict Resolution for Teams",
      coverImg: "https://example.com/image5.jpg",
      location: "Delhi",
      cost: "600.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description:
        "A hands-on workshop on resolving conflicts in team settings.",
      durationType: "Days",
      durationValue: 2,
      startDate: new Date("2025-02-10"),
      endDate: new Date("2025-02-11"),
      link: "https://dummylink5.com",
    },
    {
      title: "Building Emotional Intelligence",
      coverImg: "https://example.com/image6.jpg",
      location: "Pune",
      cost: "700.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description: "A 3-day intensive program to boost emotional intelligence.",
      durationType: "Days",
      durationValue: 3,
      startDate: new Date("2025-02-20"),
      endDate: new Date("2025-02-22"),
      link: "https://dummylink6.com",
    },
    {
      title: "Art of Active Listening",
      coverImg: "https://example.com/image7.jpg",
      location: "Kolkata",
      cost: "400.00",
      approvedBy: "f4c8d77d-13c4-4092-8178-30740748c5ad",
      createdBy: "3f088515-fc90-41a8-a270-7653e6d304b9",
      description:
        "A 1-day workshop on improving communication skills through active listening.",
      durationType: "Days",
      durationValue: 1,
      startDate: new Date("2025-02-28"),
      endDate: new Date("2025-02-28"),
      link: "https://dummylink7.com",
    },
  ]);
}

async function addPartnerLogos() {
  const logoURLs = [
    {
      name: "B Aatral",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/B%20aatral%20logo%20(1).png",
    },
    {
      name: "Bangalore Bioinnovation Centre",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/BBC-Logo-trans-800x322.png",
    },
    {
      name: "Shewell",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/finalised%20logo%20shewell%20(1).png",
    },
    {
      name: "Gene Aura",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/GeneAura%20Logo_PNG.png",
    },
    {
      name: "Inovaugmet",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/INOVAUGMET%20LATEST%20LOGO.jpeg",
    },
    {
      name: "SRIIC",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/SRIIC%20LOGO%20BIRAC%205%20(1)%20(1).png",
    },
    {
      name: "XERO",
      url: "https://emqjnmygnvlegyzkopmr.supabase.co/storage/v1/object/public/s4s-media/partners/XERA%20robatics.jpeg",
    },
  ];
  await db
    .insert(ourPartnersTable)
    .values(logoURLs.map((l) => ({ name: l.name, logo: l.url })));
}
