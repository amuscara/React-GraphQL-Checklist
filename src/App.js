import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

// list todos
const GET_TODOS = gql`
  query getTodos {
    todos_todos {
      done
      id
      text
    }
  }
`;
// toggle todos
const TOGGLE_TODO = gql`
  mutation toggleTodos($id: uuid!, $done: Boolean!) {
    update_todos_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

// add todos
const ADD_TODO = gql`
  mutation addTodo($text: String!) {
    insert_todos_todos(objects: { text: $text }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

// delete todos
const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos_todos(where: { id: { _eq: $id } }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

function App() {
  const [todoText, setTodoText] = useState('');
  const { data, loading, error } = useQuery(GET_TODOS);
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [addTodo] = useMutation(ADD_TODO, {
    onCompleted: () => setTodoText(''),
  });
  const [deleteTodo] = useMutation(DELETE_TODO);

  async function handleToggleTodo({ id, done }) {
    const data = await toggleTodo({ variables: { id: id, done: !done } });
    console.log('Toggle Todo', data);
  }

  async function handleAddTodo(event) {
    event.preventDefault();
    if (!todoText.trim()) return;
    const data = await addTodo({
      variables: { text: todoText },
      refetchQueries: [{ query: GET_TODOS }],
    });
    console.log('Add Todo', data);
  }

  async function handleDeleteTodo({ id }) {
    const isConfirmed = window.confirm('Do you want to delete this todo?');
    if (isConfirmed) {
      const data = await deleteTodo({
        variables: { id },
        update: (cache) => {
          const prevData = cache.readQuery({ query: GET_TODOS });
          const newTodos = prevData.todos_todos.filter(
            (todo) => todo.id !== id
          );
          cache.writeQuery({
            query: GET_TODOS,
            data: { todos_todos: newTodos },
          });
          console.log(prevData);
        },
      });
      console.log('Delete Todo', data);
    }
  }

  if (loading) return <div>loading....</div>;
  if (error) return <div>Error fetching todos!</div>;

  return (
    <div className='vh-100 code flex flex-column items-center bg-dark-blue white pa3'>
      <h1>
        GraphQL Checklist{' '}
        <span role='img' aria-label='Checkmark'>
          ✅
        </span>
      </h1>
      <form onSubmit={handleAddTodo} className='mb3 '>
        <input
          className='pa2 f4 b--dashed'
          type='text'
          placeholder='Write your todo'
          onChange={(event) => setTodoText(event.target.value)}
          value={todoText}
        />
        <button className='pa2 f4 bg-green' type='submit'>
          Create
        </button>
      </form>
      <div className='flex items-center justify-center flex-column'>
        {data.todos_todos.map((todo) => (
          <p onDoubleClick={() => handleToggleTodo(todo)} key={todo.id}>
            <span className={`pointer list pa1 f3 ${todo.done && 'strike'}`}>
              {todo.text}
            </span>
            <button
              onClick={() => handleDeleteTodo(todo)}
              className='bg-transparent bn f4'
            >
              <span className='red'>&times;</span>
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
