/**
 * This is a little canvas implementation that also saves a svg object.
 */
(function($, win) {
    // might be turned into a jquery plugin

    var eventNames = {
        mobile: {
            start: 'touchstart',
            move:  'touchmove',
            end:   'touchend'
        },
        desktop: {
            start: 'mousedown',
            move:  'mousemove',
            end:   'mouseout mouseup'
        }
    };

    var defaults = {
        width: 400,
        height: 300,
        context: {
            lineWidth: 2.5,
            lineCap: 'butt',
            lineJoin: 'miter',
            miterLimit: 10,
            strokeStyle: 'black',
            fillStyle: 'white'
        },
        offsets: {
            left: 10,
            top: 10
        }
    };

    win.Canvas = function(options) {
        this.options = $.extend({}, defaults, options);
        this.moved   = false;
        this.line    = [];
        this.touch   = 'ontouchstart' in window;
        this.events  = this.touch ? eventNames.mobile : eventNames.desktop;
        this.$canvas = $('<canvas></canvas>');
        this.$canvas.attr({
            width: this.options.width,
            height: this.options.height
        });
        this.canvas  = this.$canvas.get(0);
        this.context = this.canvas.getContext('2d');
        this.context = $.extend(this.context, this.options.context);

        this.$canvas.on(this.events.start, $.proxy(this.start, this));
        this.clear();
    };

    $.extend(win.Canvas.prototype, {
        // performs touchpoint calculation
        where: function(ev) {
            var point;

            if (this.touch) {
                var d = ev.originalEvent.touches[0];
                point = {
                    x: d.pageX,
                    y: d.pageY
                };
            } else {
                point = {
                    x: ev.pageX, y: ev.pageY
                };
            }

            return {
                x: point.x - this.options.offsets.left,
                y: point.y - this.options.offsets.top
            };
        },

        stroke: function(ev, dot) {
            var point = this.where(ev);

            if (true === dot) {
                this.draw({ x: point.x + 2, y: point.y});
                this.draw({ x: point.x + 2, y: point.y + 2});
                this.draw({ x: point.x, y: point.y + 2});
            }

            this.draw(point);
        },

        draw: function(point) {
            this.line.push([point.x, point.y]);
            this.context.lineTo(point.x, point.y);
            this.context.stroke();
        },

        // stops drawing
        end: function(ev) {
            if (!this.moved) {
                this.stroke(ev, true);
            }

            this.moved = false;

            var svg = this.$canvas.data("svg") || [];
            svg.push(this.line);

            this.$canvas.data("svg", svg);
            this.line = [];
            this.$canvas.off(this.events.move);
            this.$canvas.off(this.events.end);

            ev.stopImmediatePropagation();
        },

        // draws while moving the mouse/touchinput
        move: function (ev) {
            this.stroke(ev);

            this.moved = true;
            ev.preventDefault();
            ev.stopImmediatePropagation();
        },

        // starts drawing on canvas
        start: function(ev) {
            var point = this.where(ev);

            this.context.beginPath();
            this.context.moveTo(point.x, point.y);
            this.line = [[point.x, point.y]];
            this.$canvas.on(this.events.move, $.proxy(this.move, this));
            this.$canvas.on(this.events.end,  $.proxy(this.end, this));

            ev.preventDefault();
            ev.stopImmediatePropagation();
        },

        // clears whole canvas with color defined in 'fillStyle'
        clear: function() {
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.$canvas.data("svg", []);
        },

        // returns jquery object
        elem: function() {
            return this.$canvas;
        }
    });
})(jQuery, window);
