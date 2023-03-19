import css from '../theme/css.js'
import Logo from './logo.jsx'

const App = props => {
  return (
    <div
      class={css({
        textAlign: 'center',
      })}
    >
      <header
        class={css({
          backgroundColor: '#282c34',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'calc(10px + 2vmin)',
          color: 'white',
        })}
      >
        <Logo
          class={css({
            animation: 'logo-spin infinite 20s linear',
            height: '40vmin',
            pointerEvents: 'none',
          })}
          alt="logo"
        />
        <p>
          Edit <code>components/app.jsx</code> and save to reload.
        </p>
        <a
          class={css({
            color: '#b318f0',
          })}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.message}
        </a>
      </header>
    </div>
  )
}

export default App
