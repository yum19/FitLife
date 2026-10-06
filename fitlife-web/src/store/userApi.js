// src/store/userApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api' }),
  endpoints: (builder) => ({
    getUsersByRoles: builder.query({
      query: (roles = ['coach', 'nutritionniste']) =>
        `/users/roles?roles=${roles.join(',')}`,
    }),
  }),
});

export const { useGetUsersByRolesQuery } = userApi;
