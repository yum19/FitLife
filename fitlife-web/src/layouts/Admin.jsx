import React from "react";
   import { Routes, Route, Navigate } from "react-router-dom";

   // components
   import AdminNavbar from "../components/Navbars/AdminNavbar";
   import Sidebar from "../components/Sidebar/Sidebar";
   import HeaderStats from "../components/Headers/HeaderStats";
   import FooterAdmin from "../components/Footers/FooterAdmin";

   // views
   import Dashboard from "../views/admin/Dashboard";
   import Maps from "../views/admin/Maps";
   import Settings from "../views/admin/Settings";
   import Tables from "../views/admin/Tables";
   import UsersByRole from "../views/admin/UsersByRole";
   import ProduitsCatalog from "../views/admin/produit/ProduitsCatalog";
   import AddProduit from "../views/admin/produit/AddProduit";
   import EditProduit from "../views/admin/produit/EditProduit"; // New component
  import UsersTable from "../views/admin/UsersTable"; 
import ClientDetailsPage from "../views/admin/ClientDetailsPage";



   export default function Admin() {
     return (
       <>
         <Sidebar />
         <div className="relative md:ml-64 bg-blueGray-100">
           <AdminNavbar />
           {/* Header */}
           <HeaderStats />
           <div className="px-4 md:px-10 mx-auto w-full -m-24">
             <Routes>
               <Route path="dashboard" element={<Dashboard />} />
               <Route path="maps" element={<Maps />} />
               <Route path="settings" element={<Settings />} />
               <Route path="tables" element={<Tables />} />
               <Route path="tables/produits" element={<ProduitsCatalog />} />
               <Route path="tables/produits/new" element={<AddProduit />} />
               <Route path="tables/produits/edit/:id" element={<EditProduit />} /> 
               <Route path="users/:role" element={<UsersByRole />} />
               <Route path="users" element={<UsersTable />} />
               <Route path="ClientDetails/:id" element={<ClientDetailsPage/>} />
               <Route path="*" element={<Navigate to="dashboard" replace />} />
             </Routes>
             <FooterAdmin />
           </div>
         </div>
       </>
     );
   }
