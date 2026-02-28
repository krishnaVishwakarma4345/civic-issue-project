export interface Department {
  id: string;
  name: string;
  categories: string[];
  contact?: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "pwd",
    name: "Public Works Department (PWD)",
    categories: ["road"],
    contact: "pwd@civic.gov.in",
  },
  {
    id: "sanitation_dept",
    name: "Municipal Sanitation Department",
    categories: ["garbage", "sanitation"],
    contact: "sanitation@civic.gov.in",
  },
  {
    id: "water_dept",
    name: "Water Supply & Sewerage Board",
    categories: ["water", "sanitation"],
    contact: "water@civic.gov.in",
  },
  {
    id: "electricity_dept",
    name: "Electricity & Lighting Department",
    categories: ["streetlight"],
    contact: "electricity@civic.gov.in",
  },
  {
    id: "general_dept",
    name: "General Administration",
    categories: ["road", "garbage", "water", "streetlight", "sanitation"],
    contact: "admin@civic.gov.in",
  },
];

export const getDepartmentById = (id: string): Department | undefined => {
  return DEPARTMENTS.find((d) => d.id === id);
};

export const getDepartmentsForCategory = (category: string): Department[] => {
  return DEPARTMENTS.filter((d) => d.categories.includes(category));
};