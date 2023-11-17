import { ApolloClient, InMemoryCache, from, ApolloLink } from '@apollo/client';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';


const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

// The split function takes three parameters:
/**
 * one parameter return true, will run second parameter, or third parameter
*/
const setUrlLink = split(
  (operation) =>{
    return  operation.getContext().from === 'chat'
  },
  new HttpLink({ uri: "http://localhost:3000/api/graphql/chat" }),
  new HttpLink({ uri: "http://localhost:3000/api/graphql/comment" })
);


const roundTripLink = new ApolloLink((operation, forward) => {
  // Called before operation is sent to server
  operation.setContext({ start: new Date() });
  const {query} = operation
  const definition = getMainDefinition(query);
  const ctxfrom = operation.getContext().from
  return forward(operation).map((data) => {
    // Called after server responds
    const time = new Date() - operation.getContext().start;
    const key = Object.keys(data.data)
    /**
     * time: run time
     * ctxfrom: use which api
     * ${definition.operation}-${key[0]} api name
    */
    console.group(`API:${ctxfrom}---${definition.operation}-${key[0]}`)
    console.log(`Operation ${definition.operation} took ${time}ms to complete`);
    console.log(data);
    console.groupEnd()
    return data;
  });
});

// The split function takes three parameters:
// In the following example, all subscription operations are sent to GraphQLWsLink, with all other operations sent to HttpLink:
/**
 * one parameter return true, will run second parameter, or third parameter
*/
const splitLink = split(
  (args) => {
    const {query,variables} = args
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  new GraphQLWsLink(createClient({
    url: 'ws://localhost:3000/api/graphql',
  })),
  // use Directional composition to select different api
  setUrlLink
);

const client = new ApolloClient({
    // The `from` function combines an array of individual links
    // into a link chain
    link: from([roundTripLink,errorLink,splitLink]),
    cache: new InMemoryCache(),
    connectToDevTools: true,
    fetchOptions: {
      mode: 'no-cors'
  }
});

export default client