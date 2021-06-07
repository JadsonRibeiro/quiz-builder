import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

import FirestoreAuth from '../../../services/database/firestore/auth';

export default NextAuth({
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }),
    Providers.Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET_KEY,
      // authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
    }),
    Providers.Credentials({
      name: 'Email/Senha',
      credentials: {
        name: { label: "Usuário", type: "text", placeholder: "Usuário" },
        email: { label: "Email", type: "text", placeholder: "E-mail" },
        password: { label: "Senha", type: "password", placeholder: "Senha com no mínimo 6 caracteres"}
      },
      authorize: async (credentials: { name: string, password: string, email: string }) => {
        const firestoreAuth = new FirestoreAuth();
        const user = await firestoreAuth.getUser(credentials);
        console.log(user);
        
        if(user) return user;

        const userID = await firestoreAuth.createUser(credentials);
        return {
          userID,
          name: credentials.name,
          email: credentials.email
        }
      }
    })
  ]
})