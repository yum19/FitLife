import React from 'react';
import { useGetUsersByRolesQuery } from '../../store/userApi';

const UsersTable = () => {
  const { data: users = [], isLoading, error } = useGetUsersByRolesQuery();

  if (isLoading) return <p>Chargement...</p>;
  if (error) return <p>Erreur de chargement des utilisateurs</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Liste des Coaches et Nutritionnistes</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Nom</th>
            <th className="py-2 px-4 border">Email</th>
            <th className="py-2 px-4 border">Rôle</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="py-2 px-4 border">{user.nom} {user.prenom}</td>
              <td className="py-2 px-4 border">{user.email}</td>
              <td className="py-2 px-4 border">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
