# TheBizdom | BIZ of the wisDOM

This repo hosts the code for [thebizdom.in](https://www.thebizdom.in/) on the master branch which builds and serves through [github-pages](https://github.com/sidart/bizdom/deployments/activity_log?environment=github-pages).

# Environment :repeat_one:

Before starting, make sure you have [Ruby](https://www.ruby-lang.org/en/downloads/) and [NodeJS](https://nodejs.org/) installed.

And install Gulp client:
```
$ npm install gulp-cli -g
```

# Instalation :repeat_one:

Clone this repo:
```
$ git clone https://github.com/sidart/bizdom.git
```

Access the local project:
```
$ cd path/to/bizdom
```

Install npm packages:
```
$ npm install
```

Install Ruby dependencies:
```
$ bundle install
```

Build Jekyll:
```
$ bundle exec jekyll build
```
  
# Local Server :repeat:

After the steps above, to run Jekyll locally, you'll just need to run Gulp:
```
$ gulp
```

# Local Admin :repeat:

After runnning Jekyll locally, you can manage content by opening your favourite browser at
```
http:localhost:8000/admin
```

# GitHub Publish :repeat:

After making changes, you'll just need to run Gulp build:
```
$ gulp build
```

Then commit your changes and push to GitHub

