/**
 * Changing css styles: display, position, left, top, width, height, margin
 *
 * @param cellSize - [width, height] of a cell.
 * @param margins - [horizontalMargin, verticalMargin] of a cell.
 * @param fixOverlaps - move widgets down if they are overlapped.
 * @param fixGaps - move widgets up if there is room.
 * 
 * Widget properties:
 *	data-col
 *	data-row
 * 	data-width
 *	data-height
 *	min-height
 *	auto-height - if this is set to true the widget needs to have exactly one children with css height: auto and display block/inline-block
 *	is-separator - Consider widget as a separator - widgets will be prevented in moving up (separator height is actual height - 1)
 */
$.fn.gridsterize = function (opts) {
    var settings = $.extend({
        cellSizes: [30, 30],
        margins: [1, 10],
        fixOverlaps: true,
        fixGaps: true,
        autoSize: false
    }, opts);

    this.css("position", "relative");
    var children = this.children();
    cleanPreviousData(children);
    if (settings.fixGaps || settings.fixOverlaps) children = filterAndSortChildren(children);
    settings.fixOverlaps && fixOverlaps(children);
    settings.fixGaps && fixGaps(children);
    var width = 0, height = 0;
    children.each(function () {
        var $this = $(this);
        var lrMargin = 2 * settings.margins[0];
        var tbMargin = 2 * settings.margins[1];
        var cWidth = (settings.cellSizes[0] + lrMargin);
        var cHeight = (settings.cellSizes[1] + tbMargin);
        var l = getCol($this) * cWidth;
        var w = getWidth($this) * cWidth - lrMargin;
        var t = getRow($this) * cHeight;
        var h = getHeight($this) * cHeight - tbMargin;
        $this.css("left", l + "px");
        $this.css("width", w + "px");
        $this.css("top", t + "px");
        $this.css("height", h + "px");
        $this.css("display") !== "none" && $this.css("display", "inline-block");
        $this.css("position", "absolute");
        $this.css("margin", settings.margins[1] + "px " + settings.margins[0] + "px");
        width = Math.max(width, l + w + lrMargin);
        height = Math.max(height, t + h + tbMargin);
    });
    if (settings.autoSize) {
        this.css("display", "inline-block");
        this.css("height", height + "px");
    }

    function getCol(widget) {
        return parseInt(widget.data("col")) || 0;
    }

    function getRow(widget) {
        var computedRow = widget.attr("data-gr-row");
        if (computedRow != undefined) return parseInt(computedRow);
        var row = widget.data("row");
        return parseInt(row != undefined ? row : 0);
    }

    function getWidth(widget) {
        return parseInt(widget.data("width")) || 1;
    }

    function getHeight(widget) {
        var height = widget.data("height");
        if (height) return parseInt(height);
        if (widget.data("auto-height")) {
            height = parseInt(parseInt(widget.children().height()) / (settings.cellSizes[1] + 2 * settings.margins[1])) + 1;
        }
        return Math.max(parseInt(widget.data("min-height")) || 1, parseInt(height)) || 1;
    }

    function isHidden(widget) {
        return widget.css("display") === "none";
    }

    function isSpotFree(matrix, row, col, width, height) {
        for (var i = row; i < row + height; i++)
            if (matrix[i] !== undefined)
                for (var j = col; j < col + width; j++)
                    if (matrix[i][j])
                        return false;
        return true;
    }

    function hitsOnlySeparator(matrix, row, col, width, height) {
        for (var i = row; i < row + height; i++)
            if (matrix[i] !== undefined)
                for (var j = col; j < col + width; j++)
                    if (matrix[i][j] === 1)
                        return false;
        return true;
    }

    function fillSpot(matrix, row, col, width, height, val) {
        for (var i = row; i < row + height; i++) {
            if (matrix[i] === undefined) matrix[i] = [];
            for (var j = col; j < col + width; j++)
                matrix[i][j] = val;
        }
    }

    function fixOverlaps(children) {
        var matrix = [];
        var maxRow = 0;
        children.each(function () {
            var $this = $(this);
            var col = getCol($this);
            var row = Math.max(maxRow, getRow($this));//using maxRow for auto-height components that might leave gaps where widgets can fit.
            var width = getWidth($this);
            var height = getHeight($this);
            while (!isSpotFree(matrix, row, col, width, height)) row++;
            $this.attr("data-gr-row", row);
            maxRow = Math.max(maxRow, row);
            fillSpot(matrix, row, col, width, height, 1);
        });
    }

    function fixGaps(children) {
        var matrix = [];
        children.each(function () {
            var $this = $(this);
            var col = getCol($this);
            var row = getRow($this);
            var width = getWidth($this);
            var height = getHeight($this);
            while (row > 0 && isSpotFree(matrix, row - 1, col, width, height)) row--;
            if (row > 0 && hitsOnlySeparator(matrix, row - 1, col, width, height)) row--;//1 iteration is enough as separator should have height 1
            $this.attr("data-gr-row", row);
            fillSpot(matrix, row, col, width, height, $this.data("is-separator") ? 2 : 1);
        });
    }

    function filterAndSortChildren(children) {
        return children
            .filter(function () {
                return !isHidden($(this));
            })
            .sort(function (a, b) {
                var widget1 = $(a);
                var widget2 = $(b);
                var w1Row = getRow(widget1);
                var w2Row = getRow(widget2);
                if (w1Row > w2Row) {
                    return 1
                } else if (w1Row < w2Row) {
                    return -1;
                } else {
                    return widget1.index() - widget2.index();
                }
            });
    }

    function cleanPreviousData(children) {
        return children.each(function () {
            $(this).removeAttr("data-gr-row");
        });
    }

    return this;
};