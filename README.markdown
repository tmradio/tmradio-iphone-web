iPhone client for tmradio.net
=============================

This is a web application for iPhones which streams music from [tmradio.net][]
and shows what's playing.  Voting will be added later.


Installing
==========

The application itself is a bunch of static files.  Copy them to a folder on
your web server and you're ready to go.

iPhone is sensitive to content types, so make sure that the content type for
`tmradio.manifest` is `text/cache-manifest`.  If you use Nginx, you need to add
this block to your host config:

    types {
        text/cache-manifest manifest;
        text/html html;
        image/png png;
        text/css css;
        text/javascript js;
    }

On iPhone, just open the URL to use this application.


[tmradio.net]: http://www.tmradio.net/
