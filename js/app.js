(function() {
    "use strict";

    // The contact list
    var ContactList = {
        storage: [],

        push: function(contacts) {
            if(Array.isArray(contacts)) {
                this.storage = contacts;
                this.updateView();
            } else if(typeof contacts === 'object') {
                this.storage.push(contacts);
                Events.success.usersAdded++;
                this.updateView('append', contacts);
            }

            return this;
        }, 

        remove: function(obj) {
            var spliced = this.storage.splice( this.storage.indexOf(obj), 1 );
            Events.success.usersRemoved++;
            this.updateView();
            return spliced;
        },

        updateView: function(obj, method) {
            var method = method || null,
                _this = this,
                el = document.getElementById('contactList'),

                appendElement = function(contact) {
                    var newLI = document.createElement('li'),
                        button = document.createElement('input'),
                        attrs = contact.attrs;

                    button.type = 'button', button.value = 'Delete';
                    button.addEventListener('click', function(e) { _this.remove(obj) }, false);

                    newLI.innerHTML = attrs.firstName + ' ' + attrs.lastName + '<br>' + attrs.phoneNumber + '<br>';
                    newLI.appendChild(button);
                    el.appendChild(newLI);
            };

            if(method == 'append') {
                appendElement(this.storage[this.storage.length - 1]);
                return;
            }
            
            el.innerHTML = '';
            for(var c in this.storage) {
                appendElement(this.storage[c]);
            }
        }
    },


    // Contact model and prototyped methods
    Contact = function(attrs) {
        this.attrs = attrs || {};
    };

    Contact.prototype.get = function(propName) {
        return this.attrs[propName];
    };

    Contact.prototype.set = function(propName, val) {
        // validation
        if(!val.trim()) {
            throw propName + ' is required.';
        }

        var phoneRegEx = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
        if(propName == 'phoneNumber' && !val.match(phoneRegEx)) {
            throw propName + ' must be a valid phone number';
        }

        this.attrs[propName] = val
    };

    // Input / output object
    var IO = {
        resetErrors: function() {
            document.getElementById('errors').innerHTML = '';
            document.getElementById('output').style.borderColor  = '#a9a9a9';
        },

        export: function(DOMelement) {
            this.resetErrors();
            DOMelement.value = JSON.stringify(ContactList.storage);
            Events.success.exports++;
        },

        import: function(DOMelement) {
            this.resetErrors();
            try {
                ContactList.push(JSON.parse(DOMelement.value));
            } catch(e) {
                document.getElementById('errors').innerHTML = 'Could not process string.  Please check your notation and try again.'
                DOMelement.style.borderColor = '#ff0000';
                Events.failure.imports++;

                return;
            }

            Events.success.imports++;
        }
    },

    // Tracking Object
    Events = {
        init: {
            success: {
                usersAdded: { val: 0, id: 'successfulUsersAdded' },
                usersRemoved: { val: 0, id: 'successfulUsersRemoved' },
                exports: { val: 0, id: 'successfulExports' },
                imports: { val: 0, id: 'successfulImports' }
            },

            failure: {
                usersAdded: { val: 0, id: 'failureUsersAdded' },
                imports: { val: 0, id: 'failureImports' }
            }
        },
        success: {},
        failure: {},

        setter: function(prop, val) {
            prop.val = val;
            document.getElementById(prop.id).innerHTML = val;
        }
    };

    // Binding DOM updates to property setters
    Object.defineProperties(Events.success, {
        "usersAdded": {
            get: function() { return Events.init.success.usersAdded.val },
            set: function(val) {
                var prop = Events.init.success.usersAdded;
                Events.setter(prop, val);
            }
        },
        "usersRemoved": {
            get: function() { return Events.init.success.usersRemoved.val },
            set: function(val) {
                var prop = Events.init.success.usersRemoved;
                Events.setter(prop, val);
            }
        },
        "exports": {
            get: function() { return Events.init.success.exports.val },
            set: function(val) {
                var prop = Events.init.success.exports;
                Events.setter(prop, val);
            }
        },
        "imports": {
            get: function() { return Events.init.success.imports.val },
            set: function(val) {
                var prop = Events.init.success.imports;
                Events.setter(prop, val);
            }
        }
    });

    Object.defineProperties(Events.failure, {
        "usersAdded": {
            get: function() { return Events.init.failure.usersAdded.val },
            set: function(val) {
                var prop = Events.init.failure.usersAdded;
                Events.setter(prop, val);
            }
        },
        "imports": {
            get: function() { return Events.init.failure.imports.val },
            set: function(val) {
                var prop = Events.init.failure.imports;
                Events.setter(prop, val);
            }
        }
    });

    // Add listeners / bindings
    document.getElementById('submitAddContact').addEventListener('click', function(e) {
        e.preventDefault();

        var inputs = document.querySelectorAll('div#addContact form input'),

            contact = new Contact(),

            fields = [];

        // Get just the interactive input fields
        for(var i in inputs) {
            var inputNode = inputs[i];

            if(inputs.hasOwnProperty(i)) {
                if(inputNode.type !== undefined && inputNode.type !== 'submit') {
                    fields.push(inputs[i]);
                }
            }
        }

        // Set field values to the new contact
        for(var f in fields) {
            var inputNode = fields[f];

            inputNode.style.borderColor = '#a9a9a9';

            try {
                contact.set(inputNode.name, inputNode.value);
            } catch(e) {
                Events.failure.usersAdded++;
                console.log(e);
                inputNode.style.borderColor = '#ff0000';
                return;
            }

        }

        // Push the contact to the list
        ContactList.push(contact);

        // Clear fields
        for(var f in fields) {
            fields[f].value = '';
        }
    },
    false);

    document.getElementById('exportContacts').addEventListener('click', function(e) {
        e.preventDefault();

        IO.export(document.getElementById('output'));
    },
    false);

    document.getElementById('importContacts').addEventListener('click', function(e) {
        e.preventDefault();

        IO.import(document.getElementById('output'));
    },
    false);

}());
