# solid-server-template

This is a buildless Node.js server template designed for use with Solid JS. It provides a compact solution (~400 lines of code) for building and maintaining a Next.js-inspired server. It includes file routing, server-side rendering with a getServerSideProps equivalent, and ESM HMR (Hot Module Replacement) thanks to esm.sh.

# Usage

To use Solid Server Template, you can create a new project based on the template using degit:

    npx degit wethrift/solid-server-template my-solid-server

This will create a new project in a folder called my-solid-server based on the template.

Navigate to the project folder using:

    cd my-solid-server

Install the required dependencies using:

    npm install

To start the server, run:

    npm start

This will start the server and automatically reload any changes when running in development mode. This server is buildless, transpiling & bundling on the fly, so you only need to set `NODE_ENV=production` in order to run the production system.

You can navigate to http://localhost:3000 in your browser to view the application.

# Features

## Page routing

If you create any files exporting deffault components in the "/routes" directory of the project, those files will be automatically converted into server routes when the template is run. This is based on next.js, so wildcards can be created by wrapping the filename in square brackets. For example `/category/[id].js` would create a `/category/:id` route, passing the `id` into the page component.

## Server side props

Similar to next.js you can run server side function prior to rendering to gather data etc. Rather than do this inside the same page file, you use a `.data.js` suffix to your file. For example, using the above route `/category/[id].data.js` you can export a function like the following:

    export default async function serverData(request) {
      return {
        props: {
          message: 'Learn Solid',
        },
      }
    }

## Styling

This template is built using emotion css. We like theme-ui's array notation for dealing with media queries, so a lightweight version of that is also included. At this stage, you simply import the `css()` function from the theme folder, and use that in place of classnames where needed.

If you want to use traditional css, or a combination, there is a globals.css file that is also recognised, and will update on change with the dev server.

# Credits

This template was built [@wethrift](https://www.wethrift.com) by [@matt-way](https://github.com/matt-way)
