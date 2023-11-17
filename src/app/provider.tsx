'use client'
import React, { PropsWithChildren } from 'react'
import {  ApolloProvider } from '@apollo/client';
import client from '../server'

// show error information
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
if (process.env.NODE_ENV !== "production") {  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export default function Providers({
    children,
    ...props
  }: PropsWithChildren){
	return (
    <ApolloProvider client={client}>
       {children}
    </ApolloProvider>
	);
}

