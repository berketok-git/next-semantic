// @/pages/index.js
import React from "react";
import Layout from "@/components/Layout";
import SemanticSearch from "@/components/Portfolio/SemanticSearch";
import { Authenticator } from "@aws-amplify/ui-react";

export default function HomePage() {
  return (
    <Authenticator variation="modal" hideSignUp={false}>
      {({ signOut, user }) => (
        <Layout>
          <h1>Hello, {user.username}!</h1>
          <button onClick={signOut}>Sign out</button>
          <SemanticSearch />
        </Layout>
      )}
    </Authenticator>
  );
}
