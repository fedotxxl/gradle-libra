app_common.
    constant('c_host', 'http://keynote.cloudfoundry.com'). //http://localhost:8080
    factory('c_router', function(c_host) {
        return {
            exception: c_host + '/other/support/handleException',
            signIn: function(login, password, targetUri) {
                var url = c_host + '/auth/signIn?username=' + login + '&password=' + password;
                if (targetUri) url += '&targetUri=' + targetUri;

                return url
            },
            noteRoot: c_host + '/app/keynote/',
            auth: c_host + '/rest/v1/auth',
            sync: c_host + '/rest/v1/keynote/sync',
            note: function(key) { return c_host + '/app/keynote/note/' + key},
            help: c_host + '/keynote/help',
            otherPlugins: c_host + '/keynote/plugins',
            response: c_host + '/keynote/response',
            index: c_host,
            login : c_host + '/auth/login'
        }
    });