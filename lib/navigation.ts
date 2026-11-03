import { Role } from "./auth";
export const navigation:Record<Role,{label:string;path:string;icon:string;group?:string}[]>={
  student:[
    {label:"Overview",path:"",icon:"home"},{label:"My clearance",path:"clearance",icon:"shield"},{label:"Challans & payments",path:"payments",icon:"wallet"},{label:"My documents",path:"documents",icon:"file"},
    {label:"Announcements",path:"announcements",icon:"bell",group:"CAMPUS"},{label:"My profile",path:"profile",icon:"user"},{label:"Help & support",path:"help",icon:"help"}
  ],
  admin:[
    {label:"Overview",path:"",icon:"grid"},{label:"Clearance desk",path:"clearance",icon:"shield"},{label:"Student records",path:"students",icon:"users"},
    {label:"Inventory",path:"inventory",icon:"box",group:"OPERATIONS"},{label:"Breakage & issues",path:"incidents",icon:"flask"},{label:"Challans & payments",path:"payments",icon:"wallet"},{label:"Data import",path:"imports",icon:"upload"},{label:"Reports",path:"reports",icon:"chart"},
    {label:"People & access",path:"people",icon:"key",group:"ADMINISTRATION"},{label:"Audit history",path:"audit",icon:"history"},{label:"Settings",path:"settings",icon:"settings"},{label:"Announcements",path:"announcements",icon:"bell"}
  ],
  staff:[
    {label:"My workbench",path:"",icon:"grid"},{label:"Verification queue",path:"clearance",icon:"shield"},{label:"Student search",path:"students",icon:"users"},
    {label:"Assigned inventory",path:"inventory",icon:"box",group:"MY DEPARTMENTS"},{label:"Breakage & issues",path:"incidents",icon:"flask"},{label:"Reports",path:"reports",icon:"chart"},{label:"Announcements",path:"announcements",icon:"bell"},{label:"Help & support",path:"help",icon:"help"}
  ],
  accounts:[
    {label:"Reconciliation",path:"",icon:"grid"},{label:"Payments & challans",path:"payments",icon:"wallet"},{label:"Clearance records",path:"clearance",icon:"shield"},{label:"Reports",path:"reports",icon:"chart"},{label:"Announcements",path:"announcements",icon:"bell"},{label:"Help & support",path:"help",icon:"help"}
  ],
  teacher:[
    {label:"Teaching overview",path:"",icon:"home"},{label:"My classes",path:"classes",icon:"book"},{label:"Class observations",path:"observations",icon:"message"},{label:"Announcements",path:"announcements",icon:"bell"},{label:"Help & support",path:"help",icon:"help"}
  ],
  alumni:[
    {label:"Alumni home",path:"",icon:"home"},{label:"Clearance history",path:"clearance",icon:"shield"},{label:"My documents",path:"documents",icon:"file"},{label:"Campus updates",path:"announcements",icon:"bell"},{label:"My profile",path:"profile",icon:"user"},{label:"Help & support",path:"help",icon:"help"}
  ]
};
export const roleNames:Record<Role,string>={student:"Student",staff:"Staff",accounts:"Accounts",admin:"Administration",teacher:"Faculty",alumni:"Alumni"};
