import mongoose from "mongoose";
import dotenv from "dotenv";
import Invitation from "../models/Invitation.js"; // ajustá la ruta según tu proyecto

dotenv.config();

const DEMO_INVITATIONS = [
  {
    slug: "demo-vintage-boda",
    templateId: "Vintage",
    status: "active",
    hostContact: { name: "Demo Vintage", whatsapp: "5493510000000" },
    eventData: {
      eventType: "wedding",
      title: "Camila & Tomás",
      hosts: ["Camila", "Tomás"],
      eventDate: "2027-04-18T20:00:00.000Z",
      dressCode: "Elegante",
      welcomeMessage: "¡Queremos compartir con ustedes este día tan especial!",
    },
  },
  {
    slug: "demo-minimalist-boda",
    templateId: "Minimalist",
    status: "active",
    hostContact: { name: "Demo Minimalist", whatsapp: "5493510000000" },
    eventData: {
      eventType: "wedding",
      title: "Lucía & Martín",
      hosts: ["Lucía", "Martín"],
      eventDate: "2027-05-10T19:30:00.000Z",
      dressCode: "Formal / Elegante",
      welcomeMessage: "Nos casamos y queremos celebrarlo a tu lado.",
    },
  },
  {
    slug: "demo-botanical-boda",
    templateId: "Botanical",
    status: "active",
    hostContact: { name: "Demo Botanical", whatsapp: "5493510000000" },
    eventData: {
      eventType: "wedding",
      title: "Sofía & Lucas",
      hosts: ["Sofía", "Lucas"],
      eventDate: "2027-03-27T17:30:00.000Z",
      dressCode: "Campestre chic",
      welcomeMessage: "Una tarde al aire libre rodeados de afecto y naturaleza.",
    },
  },
  {
    slug: "demo-festive-quince",
    templateId: "Festive",
    status: "active",
    hostContact: { name: "Demo Festive", whatsapp: "5493510000000" },
    eventData: {
      eventType: "quinceanera",
      title: "Mis 15 • Valentina",
      hosts: ["Valentina"],
      eventDate: "2027-06-12T21:00:00.000Z",
      dressCode: "Elegante sport",
      welcomeMessage: "¡Llegaron mis 15 y no podés faltar!",
    },
  },
  {
    slug: "demo-glam-quince",
    templateId: "Glam",
    status: "active",
    hostContact: { name: "Demo Glam", whatsapp: "5493510000000" },
    eventData: {
      eventType: "quinceanera",
      title: "15 Años • Isabella",
      hosts: ["Isabella"],
      eventDate: "2027-07-03T21:30:00.000Z",
      dressCode: "Gala / Noche",
      welcomeMessage: "Una noche mágica para celebrar mis 15 años.",
    },
  },
  {
    slug: "demo-classic-comunion",
    templateId: "Classic",
    status: "active",
    hostContact: { name: "Demo Classic", whatsapp: "5493510000000" },
    eventData: {
      eventType: "communion",
      title: "Mi Primera Comunión • Mateo",
      hosts: ["Mateo"],
      eventDate: "2027-09-19T11:00:00.000Z",
      dressCode: "Clásico",
      welcomeMessage: "Acompañanos en este paso tan importante de mi fe.",
    },
  },
  {
    slug: "demo-celestial-comunion",
    templateId: "Celestial",
    status: "active",
    hostContact: { name: "Demo Celestial", whatsapp: "5493510000000" },
    eventData: {
      eventType: "communion",
      title: "Bautismo y Comunión • Ciro",
      hosts: ["Ciro"],
      eventDate: "2027-10-09T12:00:00.000Z",
      dressCode: "Casual elegante",
      welcomeMessage: "Compartimos la alegría de este encuentro familiar.",
    },
  },
  {
    slug: "demo-party-cumple",
    templateId: "Party",
    status: "active",
    hostContact: { name: "Demo Party", whatsapp: "5493510000000" },
    eventData: {
      eventType: "birthday",
      title: "¡Cumple de Franco!",
      hosts: ["Franco"],
      eventDate: "2027-02-20T21:00:00.000Z",
      dressCode: "Libre / Fiesta",
      welcomeMessage: "¡Vení a brindar y bailar conmigo!",
    },
  },
  {
    slug: "demo-minimalist-cumple",
    templateId: "Minimalist",
    status: "active",
    hostContact: { name: "Demo Cumple", whatsapp: "5493510000000" },
    eventData: {
      eventType: "birthday",
      title: "Cena por los 30 • Julieta",
      hosts: ["Julieta"],
      eventDate: "2027-08-14T20:30:00.000Z",
      dressCode: "Smart casual",
      welcomeMessage: "Una noche íntima para celebrar los 30.",
    },
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const item of DEMO_INVITATIONS) {
    await Invitation.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, new: true }
    );
  }
  console.log("Demos cargadas correctamente.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});