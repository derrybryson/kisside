![KISS IDE](source/resource/kisside/kisside_background.png "KISS IDE Logo")

# What is it?

KISS IDE is a simple web based "Integrated Development Environment".  "IDE" is in quotes because initially, at least, it is mostly a simple
filesystem tree with a text editor (although, a pretty good editor named ACE from Cloud9).  More things are planned for the future, but it is 
very usable as is to edit text files on the server on which it is installed.  This makes it very convienent to create/edit Wordpress themes and plugins
or develop custom PHP, Python (maybe Django), Ruby (Rails), Node.js, etc. websites.

# Features

* SPA (Single Page App) with familiar GUI style application interface (utilizing the QooxDoo Javascript framework)
* Powerful text editor ([ACE](https://ace.c9.io) from Cloud9) with syntax highlighting and error detection for many languages and file types
* Tree style filesystem access
* Supports tab based interface to allow editing multiple files in multiple tabs
* Simple user account system for multiple users
* Two levels of authentication: HTTP basic authentication at the web server level and user accounts at the application level
* Safe write to "temp file before overwrite" file save operation 
* Confirmation to overwrite file with newer modification date/time
* Configurable text editor theme (both dark and light themes)

# Installation Requirements

* Apache
* PHP 5.4 (PHP 7 has not been tested)
* SQLITE3
* PHP SQLITE module

Although the current installation is setup for Apache, it should be straight forward to set it up with Nginx.  It is designed to be an alias like
phpmyadmin.

# Installation

Currently

# Build Requirements

* Qooxdoo SDK 5.0.1