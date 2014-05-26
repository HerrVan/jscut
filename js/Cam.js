// Copyright 2014 Todd Fleming

var Cam = new function () {
    var Cam = this;

    // Does the line from p1 to p2 cross outside of bounds?
    function crosses(bounds, p1, p2) {
        var clipper = new ClipperLib.Clipper();
        clipper.AddPath([p1, p2], ClipperLib.PolyType.ptSubject, false);
        clipper.AddPaths(bounds, ClipperLib.PolyType.ptClip, true);
        var result = new ClipperLib.PolyTree();
        clipper.Execute(ClipperLib.ClipType.ctIntersection, result, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        if (result.ChildCount() == 1) {
            var child = result.Childs()[0];
            points = child.Contour();
            if (points.length == 2) {
                if (points[0].X == p1.X && points[1].X == p2.X && points[0].Y == p1.Y && points[1].Y == p2.Y)
                    return false;
                if (points[0].X == p2.X && points[1].X == p1.X && points[0].Y == p2.Y && points[1].Y == p1.Y)
                    return false;
            }
        }
        return true;
    }

    // Try to merge paths. A merged path doesn't cross outside of bounds.
    function mergePaths(bounds, paths) {
        if (paths.length == 0)
            return null;

        currentPath = paths[0];
        currentPath.push(currentPath[0]);
        currentPoint = currentPath[currentPath.length-1];
        paths[0] = [];

        mergedPaths = [];
        var numLeft = paths.length - 1;
        while (numLeft > 0) {
            var closestPathIndex = null;
            var closestPointIndex = null;
            var closestPointDist = null;
            for (var pathIndex = 0; pathIndex < paths.length; ++pathIndex) {
                path = paths[pathIndex];
                for (var pointIndex = 0; pointIndex < path.length; ++pointIndex) {
                    point = path[pointIndex];
                    dist = (currentPoint.X - point.X) * (currentPoint.X - point.X) + (currentPoint.Y - point.Y) * (currentPoint.Y - point.Y);
                    if (closestPointDist == null || dist < closestPointDist) {
                        closestPathIndex = pathIndex;
                        closestPointIndex = pointIndex;
                        closestPointDist = dist;
                    }
                }
            }

            path = paths[closestPathIndex];
            paths[closestPathIndex] = [];
            numLeft -= 1;
            var needNew = crosses(bounds, currentPoint, path[closestPointIndex]);
            path = path.slice(closestPointIndex, path.length).concat(path.slice(0, closestPointIndex));
            path.push(path[0]);
            if (needNew) {
                mergedPaths.push(currentPath);
                currentPath = path;
                currentPoint = currentPath[currentPath.length - 1];
            }
            else {
                currentPath = currentPath.concat(path);
                currentPoint = currentPath[currentPath.length - 1];
            }
        }
        mergedPaths.push(currentPath);
        return mergedPaths;
    }

    // Compute paths for pocket operation on Clipper geometry. Returns
    // array of open paths. cutterDia is in Clipper units. overlap is 
    // in the range [0, 1).
    Cam.pocket = function (geometry, cutterDia, overlap) {
        var current = Path.offset(geometry, -cutterDia / 2);
        var bounds = current.slice(0);
        var allPaths = [];
        while (current.length != 0) {
            allPaths = current.concat(allPaths);
            current = Path.offset(current, -cutterDia * (1 - overlap));
        }
        return mergePaths(bounds, allPaths);
    };

    // Compute paths for outline operation on Clipper geometry. Returns
    // array of open paths. cutterDia and width are in Clipper units. 
    // overlap is in the range [0, 1).
    Cam.outline = function (geometry, cutterDia, width, overlap) {
        var current = Path.offset(geometry, cutterDia / 2);
        var currentWidth = cutterDia;
        var bounds = Path.diff(Path.offset(geometry, width), geometry);
        var allPaths = [];
        var eachOffset = cutterDia * (1 - overlap);
        while (currentWidth <= width) {
            allPaths = current.concat(allPaths);
            var nextWidth = currentWidth + eachOffset;
            if (nextWidth > width && width - currentWidth > 0) {
                current = Path.offset(current, width - currentWidth);
                allPaths = current.concat(allPaths);
                break;
            }
            currentWidth = nextWidth;
            current = Path.offset(current, eachOffset);
        }
        return mergePaths(bounds, allPaths);
    };
};
