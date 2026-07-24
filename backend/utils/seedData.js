const User = require("../models/User");
const Group = require("../models/Group");
const Membership = require("../models/Membership");
const Event = require("../models/Events");
const Rsvp = require("../models/Rsvp");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const ExpenseShare = require("../models/ExpenseShare");
const Invitation = require("../models/Invitation");

const DEMO_PASSWORD = "Demo1234!";

async function wipeAllCollections() {
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Membership.deleteMany({}),
    Event.deleteMany({}),
    Rsvp.deleteMany({}),
    Message.deleteMany({}),
    Expense.deleteMany({}),
    ExpenseShare.deleteMany({}),
    Invitation.deleteMany({}),
  ]);
}

async function seedDatabase({ wipeFirst = true, log = console.log } = {}) {
  if (wipeFirst) {
    log("Wiping existing data...");
    await wipeAllCollections();
  }

  log("Creating users...");
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  const [andrew, milad, aadil, dang, czarina, hunee] = await User.create([
    { name: "Tirso Andrew Albuera", email: "andrew@demo", passwordHash },
    { name: "Milad Nazari", email: "milad@demo.com", passwordHash },
    { name: "Aadil Syed", email: "aadil@demo.com", passwordHash },
    { name: "Dang Huy Cao", email: "dang@demo.com", passwordHash },
    { name: "Czarina Emmanuelle Taborada", email: "czarina@demo.com", passwordHash },
    { name: "Hunee Park", email: "hunee@demo.com", passwordHash },
  ]);

  log("Creating group and memberships...");
  const group = await Group.create({
    name: "Alberta Trip 2026",
    description: "A trip-planning group for an August 2026 visit to Alberta.",
    organizerId: andrew._id,
  });

  await Membership.create([
    { groupId: group._id, userId: andrew._id, roleInGroup: "organizer" },
    { groupId: group._id, userId: milad._id, roleInGroup: "member" },
    { groupId: group._id, userId: aadil._id, roleInGroup: "member" },
    { groupId: group._id, userId: dang._id, roleInGroup: "member" },
    { groupId: group._id, userId: czarina._id, roleInGroup: "member" },
    { groupId: group._id, userId: hunee._id, roleInGroup: "member" },
  ]);

  log("Creating a second, smaller group...");
  const group2 = await Group.create({
    name: "Dinner Club",
    description: "Monthly dinner meetups.",
    organizerId: milad._id,
  });
  await Membership.create([
    { groupId: group2._id, userId: milad._id, roleInGroup: "organizer" },
    { groupId: group2._id, userId: andrew._id, roleInGroup: "member" },
    { groupId: group2._id, userId: czarina._id, roleInGroup: "member" },
  ]);

  log("Creating events with RSVPs...");
  const event1 = await Event.create({
    groupId: group._id,
    title: "Banff Venture",
    location: "Lake Louise",
    startTime: new Date("2026-08-21T14:00:00"),
    description: "Scenic day hike around the lake. Bring water and layers.",
    createdBy: andrew._id,
  });
  const allMembers = [andrew, milad, aadil, dang, czarina, hunee];
  const responses = ["going", "going", "maybe", "cant_make_it", "going", "no_response"];
  await Rsvp.create(
    allMembers.map((u, i) => ({
      eventId: event1._id,
      userId: u._id,
      response: responses[i],
      respondedAt: responses[i] !== "no_response" ? new Date() : undefined,
    }))
  );

  const event2 = await Event.create({
    groupId: group._id,
    title: "Cabin Dinner",
    location: "Canmore Cabin",
    startTime: new Date("2026-08-22T18:30:00"),
    description: "Group dinner at the cabin - potluck style.",
    createdBy: andrew._id,
  });
  await Rsvp.create(
    allMembers.map((u) => ({ eventId: event2._id, userId: u._id, response: "no_response" }))
  );

  log("Creating chat messages...");
  const chatLines = [
    [andrew, "Welcome to the group everyone!"],
    [aadil, "Hey I'll find some great places to stay in Alberta"],
    [milad, "Should we book the hike for Saturday?"],
    [czarina, "Yeah, I'm ok with that!"],
    [andrew, "Hey I booked the room at 9 AM"],
    [milad, "Yeah, nice"],
    [czarina, "I'll bring snacks for everyone"],
    [dang, "What time should we leave on Friday?"],
    [hunee, "I can drive if someone wants a ride"],
    [aadil, "Sounds good, I'll be ready by 8"],
    [andrew, "Perfect, let's meet at the parking lot"],
    [milad, "Should we bring hiking poles?"],
    [czarina, "I have extras if anyone needs some"],
    [dang, "I'm bringing my camera for photos"],
    [hunee, "Nice, can't wait to see the lake"],
    [aadil, "Weather looks good for Saturday"],
    [andrew, "Great, fingers crossed it stays that way"],
    [milad, "Anyone know a good spot for lunch after?"],
    [czarina, "There's a place near the trailhead, pretty good reviews"],
    [dang, "Let's try it, sounds good"],
    [hunee, "I'm in"],
    [aadil, "Same here"],
    [andrew, "Alright, plan's set then"],
    [milad, "See everyone Saturday!"],
    [czarina, "Looking forward to it"],
    [dang, "Same"],
    [hunee, "This is going to be fun"],
    [aadil, "Definitely"],
    [andrew, "One more thing - don't forget sunscreen"],
    [milad, "Good call"],
    [czarina, "Adding that to my list"],
    [dang, "Thanks for the reminder"],
    [hunee, "Will do"],
  ];

  let msgTime = Date.now() - chatLines.length * 60000;
  for (const [user, body] of chatLines) {
    await Message.create({
      groupId: group._id,
      senderId: user._id,
      content: body,
      sentAt: new Date(msgTime),
    });
    msgTime += 60000;
  }

  log("Creating expenses...");
  const expense1 = await Expense.create({
    groupId: group._id,
    paidBy: andrew._id,
    amount: 4755,
    purpose: "Lunch at McDonalds",
    splitType: "equal",
    createdBy: andrew._id,
  });
  const splitMembers = [andrew, milad, aadil, dang];
  const shareEach = Math.floor(4755 / splitMembers.length);
  const remainder = 4755 - shareEach * splitMembers.length;
  await ExpenseShare.create(
    splitMembers.map((u, i) => ({
      expenseId: expense1._id,
      userId: u._id,
      shareAmount: shareEach + (i < remainder ? 1 : 0),
    }))
  );

  const expense2 = await Expense.create({
    groupId: group._id,
    paidBy: aadil._id,
    amount: 5000,
    purpose: "Gas",
    splitType: "equal",
    createdBy: aadil._id,
  });
  const gasShare = Math.floor(5000 / allMembers.length);
  const gasRemainder = 5000 - gasShare * allMembers.length;
  await ExpenseShare.create(
    allMembers.map((u, i) => ({
      expenseId: expense2._id,
      userId: u._id,
      shareAmount: gasShare + (i < gasRemainder ? 1 : 0),
    }))
  );

  const expense3 = await Expense.create({
    groupId: group._id,
    paidBy: czarina._id,
    amount: 12000,
    purpose: "Cabin rental deposit",
    splitType: "custom",
    createdBy: czarina._id,
  });
  await ExpenseShare.create([
    { expenseId: expense3._id, userId: andrew._id, shareAmount: 3000 },
    { expenseId: expense3._id, userId: milad._id, shareAmount: 2500 },
    { expenseId: expense3._id, userId: aadil._id, shareAmount: 2500 },
    { expenseId: expense3._id, userId: dang._id, shareAmount: 2000 },
    { expenseId: expense3._id, userId: czarina._id, shareAmount: 2000 }, 
  ]); //matches the total exactly

  log("Creating a pending invitation (not yet accepted)...");
  await Invitation.create({
    groupId: group._id,
    email: "newperson@demo.com",
    invitedBy: andrew._id,
  });

  log("\nDone. Demo accounts (all use password: " + DEMO_PASSWORD + "):");
  for (const u of allMembers) {
    log(`  ${u.email}  (${u.name})`);
  }
  log('\nAndrew is the organizer of "Alberta Trip 2026".');
  log('Milad is the organizer of "Dinner Club".');
}

module.exports = { seedDatabase, DEMO_PASSWORD };