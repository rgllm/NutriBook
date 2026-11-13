export const CITIES = [
  "Braga",
  "Porto",
  "Lisboa",
  "Guimarães",
  "Coimbra",
  "Leiria",
  "Aveiro",
  "Faro",
] as const

export type City = (typeof CITIES)[number]

export const DEFAULT_CITY: City = "Braga"

export type Service = {
  name: string
  priceEur: number
}

export type Nutritionist = {
  id: string
  name: string
  title: "Nutritionist" | "Dietitian"
  licenseNumber: string
  city: City
  address: string
  offersOnline: boolean
  services: Service[]
}

export const NUTRITIONISTS: Nutritionist[] = [
  {
    id: "mary-jane",
    name: "Mary Jane",
    title: "Dietitian",
    licenseNumber: "2963N",
    city: "Braga",
    address: "Rua do Souto 45",
    offersOnline: true,
    services: [
      { name: "First appointment", priceEur: 25 },
      { name: "Follow-up", priceEur: 20 },
      { name: "Weight loss", priceEur: 30 },
    ],
  },
  {
    id: "ana-ferreira",
    name: "Ana Ferreira",
    title: "Nutritionist",
    licenseNumber: "1874N",
    city: "Braga",
    address: "Avenida da Liberdade 210",
    offersOnline: false,
    services: [
      { name: "First appointment", priceEur: 35 },
      { name: "Sports nutrition", priceEur: 40 },
      { name: "Follow-up", priceEur: 25 },
    ],
  },
  {
    id: "joao-martins",
    name: "João Martins",
    title: "Nutritionist",
    licenseNumber: "3310N",
    city: "Braga",
    address: "Praça da República 12",
    offersOnline: true,
    services: [
      { name: "First appointment", priceEur: 30 },
      { name: "Plant-based diets", priceEur: 35 },
      { name: "Diabetes management", priceEur: 40 },
      { name: "Follow-up", priceEur: 22 },
    ],
  },
  {
    id: "sofia-lopes",
    name: "Sofia Lopes",
    title: "Dietitian",
    licenseNumber: "2451N",
    city: "Braga",
    address: "Rua de São Vicente 88",
    offersOnline: true,
    services: [
      { name: "Child nutrition", priceEur: 35 },
      { name: "Pregnancy nutrition", priceEur: 40 },
      { name: "Follow-up", priceEur: 25 },
    ],
  },
  {
    id: "ricardo-sousa",
    name: "Ricardo Sousa",
    title: "Nutritionist",
    licenseNumber: "4102N",
    city: "Braga",
    address: "Rua Dom Pedro V 150",
    offersOnline: false,
    services: [
      { name: "Sports nutrition", priceEur: 45 },
      { name: "Body composition analysis", priceEur: 20 },
    ],
  },
  {
    id: "marta-ribeiro",
    name: "Marta Ribeiro",
    title: "Dietitian",
    licenseNumber: "1590N",
    city: "Braga",
    address: "Largo do Paço 3",
    offersOnline: true,
    services: [
      { name: "Food intolerances", priceEur: 40 },
      { name: "First appointment", priceEur: 35 },
      { name: "Follow-up", priceEur: 25 },
    ],
  },
  {
    id: "pedro-almeida",
    name: "Pedro Almeida",
    title: "Nutritionist",
    licenseNumber: "2877N",
    city: "Porto",
    address: "Rua de Santa Catarina 300",
    offersOnline: true,
    services: [
      { name: "Weight loss", priceEur: 35 },
      { name: "Sports nutrition", priceEur: 40 },
      { name: "Follow-up", priceEur: 25 },
    ],
  },
  {
    id: "ines-carvalho",
    name: "Inês Carvalho",
    title: "Dietitian",
    licenseNumber: "3655N",
    city: "Porto",
    address: "Avenida da Boavista 1200",
    offersOnline: false,
    services: [
      { name: "Diabetes management", priceEur: 45 },
      { name: "First appointment", priceEur: 40 },
    ],
  },
  {
    id: "catarina-santos",
    name: "Catarina Santos",
    title: "Nutritionist",
    licenseNumber: "1203N",
    city: "Lisboa",
    address: "Avenida da República 50",
    offersOnline: true,
    services: [
      { name: "Plant-based diets", priceEur: 45 },
      { name: "Weight loss", priceEur: 45 },
      { name: "Follow-up", priceEur: 30 },
    ],
  },
  {
    id: "tiago-pereira",
    name: "Tiago Pereira",
    title: "Nutritionist",
    licenseNumber: "4420N",
    city: "Guimarães",
    address: "Rua de Santa Maria 17",
    offersOnline: true,
    services: [
      { name: "First appointment", priceEur: 25 },
      { name: "Sports nutrition", priceEur: 30 },
    ],
  },
  {
    id: "beatriz-costa",
    name: "Beatriz Costa",
    title: "Dietitian",
    licenseNumber: "3018N",
    city: "Coimbra",
    address: "Rua Ferreira Borges 60",
    offersOnline: false,
    services: [
      { name: "Child nutrition", priceEur: 30 },
      { name: "Food intolerances", priceEur: 35 },
    ],
  },
  {
    id: "helena-rocha",
    name: "Helena Rocha",
    title: "Dietitian",
    licenseNumber: "2190N",
    city: "Leiria",
    address: "Rua de Leiria 9",
    offersOnline: true,
    services: [
      { name: "First appointment", priceEur: 25 },
      { name: "Follow-up", priceEur: 20 },
    ],
  },
]

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const

export type TimeSlot = (typeof TIME_SLOTS)[number]
