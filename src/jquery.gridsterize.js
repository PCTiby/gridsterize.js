$.fn.gridsterize = function (opts) {
    var settings = $.extend({
        colWidth: 30,
        colHeight: 30,
        margins: [1, 10],
        fixOverlaps: true,
        fixGaps: true,
        autoSize: false
    }, opts);

    var xData = function (widget) {
        return widget.data("x");
    };
    var yData = function (widget) {
        return widget.attr("data-gr-y") || widget.data("y");
    };
    var widthData = function (widget) {
        return widget.data("width");
    };
    var heightData = function (widget) {
        return widget.data("height") || parseInt(parseInt(widget.css("height")) / (settings.colHeight + 2 * settings.margins[1])) + 1;
    };
    var spotFree = function (matrix, x, y, w, h) {
        for (var i = x; i < x + w; i++)
            if (matrix[i] !== undefined)
                for (var j = y; j < y + h; j++)
                    if (matrix[i][j])
                        return false;
        return true;
    };
    var isHidden = function (widget) {
        return widget.css("display") === "none";
    };
    var fixOverlaps = function (children) {
        var matrix = [];
        children.each(function () {
            var $this = $(this);
            var x = xData($this);
            var y = yData($this);
            var w = widthData($this);
            var h = heightData($this);
            while (!spotFree(matrix, x, y, w, h)) y++;
            $this.attr("data-gr-y", y);
            fillSpot(matrix, x, y, w, h);
        });
    };
    var fixGaps = function (children) {
        var matrix = [];
        children.each(function () {
            var $this = $(this);
            var x = xData($this);
            var y = yData($this);
            var w = widthData($this);
            var h = heightData($this);
            while (y > 0 && spotFree(matrix, x, y - 1, w, h)) y--;
            $this.attr("data-gr-y", y);
            fillSpot(matrix, x, y, w, h);
        });
    };
    var fillSpot = function (matrix, x, y, w, h) {
        for (var i = x; i < x + w; i++) {
            if (matrix[i] === undefined) matrix[i] = [];
            for (var j = y; j < y + h; j++) matrix[i][j] = true;
        }
    };
    var filterAndSortChildren = function (children) {
        return children
            .filter(function () {
                return !isHidden($(this));
            })
            .sort(function (a, b) {
                var widget1 = $(a);
                var widget2 = $(b);
                var y1 = yData(widget1);
                var y2 = yData(widget2);
                if (y1 > y2) {
                    return 1
                } else if (y1 < y2) {
                    return -1;
                } else {
                    return widget1.index() - widget2.index();
                }
            });
    };
    var cleanPreviuousData = function (children) {
        return children.each(function() {
			$(this).removeAttr("data-gr-y");
		});
    };

    this.css("position", "relative");
    var children = this.children();
	cleanPreviuousData(children);
    if (settings.fixGaps || settings.fixOverlaps) {
        children = filterAndSortChildren(children);
    }
    if (settings.fixOverlaps) fixOverlaps(children);
    if (settings.fixGaps) fixGaps(children);
    var width = 0, height = 0;
    children.each(function () {
        var $this = $(this);
        var lrMargin = 2 * settings.margins[0];
        var tbMargin = 2 * settings.margins[1];
        var colWidth = (settings.colWidth + lrMargin);
        var colHeight = (settings.colHeight + tbMargin);
        var r = xData($this) * colWidth;
        var w = widthData($this) * colWidth - lrMargin;
        var t = yData($this) * colHeight;
        var h = heightData($this) * colHeight - tbMargin;
        var left = r + w + lrMargin;
        var bottom = t + h + tbMargin;
        $this.css("left", r + "px");
        $this.css("width", w + "px");
        $this.css("top", t + "px");
        $this.css("height", h + "px");
        if ($this.css("display") !== "none")
            $this.css("display", "inline-block");
        $this.css("position", "absolute");
        $this.css("margin", settings.margins[1] + "px " + settings.margins[0] + "px");
        if (width < left) width = left;
        if (height < bottom) height = bottom;
    });
    if (settings.autoSize) {
        this.css("display", "inline-block");
        this.css("height", height + "px");
    }
    return this;
};