# nextjs-App_router-apollo_client


::: tip

#### nextjs-App_router-apollo_client

::: Tip

1. nextjs APP router  support apollo_client, install nextjs app router
2. install nexjt, and select app router
* npx create-next-app@latest / yarn create next-app / pnpm create next-app
3. install graphql  apollo_client etc.  which we need modules


::::

### create client.js
* server.js exists nextjs page router's root directory
* use "new ApolloClient" Directional composition by client to select different api
["Apollo Link overview"](https://www.apollographql.com/docs/react/api/link/introduction/#handling-a-response)


```js{75,81}
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

 ```
::: tip
#### 1. UI components will use useQuery\useMutation\useSubscription to process data

* useMutation: { context: { "from":"chat" }} to process - const ctxfrom = operation.getContext().from, then to select different api

```js{25,37,45}
const ADD_Chat = gql`
  mutation AddChat($message: String!,$type: String!) {
    addChat(message: $message,type: $type) {
      id
      message
      type
    }
  }
`;

const ONPOSTCHAT_SUBSCRIPTION = gql`
  subscription {
    onPostChat {
      id
      message
      type
    }
  }
`;

funciton Page(){
  // useMutation
  // { context: { "from":"chat" }} to process, client.js
  // const ctxfrom = operation.getContext().from, then to select different api
  const [addChat] = useMutation(ADD_Chat,{ context: { "from":"chat" }});
  const onPublishChat = () => {
    addChat({ variables: { message: msg ,type:"own"} }).then((val)=>{
      alert('add successfully!')
    }, (error)=>{
      console.log(error)
    })
  }

 // useSubscription
 // context: { "from":"chat" } to process, client.js --- const ctxfrom = operation.getContext().from, then to select different api
 // {variables: { "from":"chat" }} to process server.js --- subscribe(args.variableValues)
  const { data, error, loading } = useSubscription(ONPOSTCHAT_SUBSCRIPTION,  { variables: { "from":"chat" }, context: { "from":"chat" },fetchPolicy: "no-cache"});
  const [accumulatedData, setAccumulatedData] = useState<DataType[]>([]);

  useEffect(() => {
    // console.log('data ==000 --- 999 ---data')
    // console.log(data)
    if(data){
      // get onPostChat return data
      let postdata = data.onPostChat;
      setAccumulatedData((prev) => {
        return [...prev, postdata]
      });
    }
  }, [data]);

  return <div />
}
```
* useSubscription:{variables: { "from":"chat" }} to process server.js to select different api
```js
subscribe: args => {
    const variables = args.variableValues
    if(variables.from){
      graphqlEndpoint = `/api/graphql/${variables.from}`
    }else{
      graphqlEndpoint = `/api/graphql/chat`
    }
    return args.rootValue.subscribe(args)
},
```

#### 2. same UI components, use useQuery,useMutation, parametes can change different name
```js{1,7}
  const [loadGreeting, { called, loading, data, refetch }] = useLazyQuery(
    GET_CHAT_QUERY,{ context: { "from":"chat" } }
  );
  const [datas, setDatas] = useState<DataType[]>([]);

  // use data:helloqu change parameter name
  const { data:helloqu, error:errorhello, loading:loadinghello } = useQuery(
    HELLO_QUERY,{ context: { "from":"comment" }}
  );

```
:::

