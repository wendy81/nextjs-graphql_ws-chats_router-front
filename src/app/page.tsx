'use client'

import React, { useEffect,useState } from 'react'
import { useQuery, gql,useMutation,useSubscription } from '@apollo/client';


type DataType = {
  id:string
  message:string
  type:string
}

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

export default function  Page(){
  // useMutation
  // { context: { "from":"chat" }} to process, client.js
  // const ctxfrom = operation.getContext().from, then to select different api
  const [msg,setMsg] = useState('')
  const [addChat] = useMutation(ADD_Chat,{ context: { "from":"chat" }});
  const onPublishChat = () => {
    addChat({ variables: { message: msg ,type:"other"} }).then((val)=>{
      alert('add successfully!')
    }, (error)=>{
      console.log(error)
    })
  }

  const focuseEvent = (e:any)=>{
    e.target.value = ""
    setMsg("")
  }
  const changeEvent = (e:any)=>{
    const {value} = e.target;
    setMsg(value)
  }

 // useSubscription
 // context: { "from":"chat" } to process, client.js --- const ctxfrom = operation.getContext().from, then to select different api
 // {variables: { "from":"chat" }} to process server.js --- subscribe(args.variableValues)
  const { data, error, loading } = useSubscription(ONPOSTCHAT_SUBSCRIPTION,  { variables: { "from":"chat" }, context: { "from":"chat" },fetchPolicy: "no-cache"});
  const [accumulatedData, setAccumulatedData] = useState<DataType[]>([]);

  useEffect(() => {
    if(data){
      let postdata = data.onPostChat;
      setAccumulatedData((prev) => {
        return [...prev, postdata]
      });
    }
  }, [data]);


  const list = accumulatedData.map(v=>
    (<li key={v.id}>
    ${v.id} : {v.message} + {v.type}
    </li>)
  )

  return (
    <div>
      {list}
      <input value={msg} type="text" placeholder="please input text information!" onChange={changeEvent} onFocus={focuseEvent} style={{color: "red"}} /> <br />
      <button onClick={onPublishChat}>submit</button>
    </div>
  )
}

