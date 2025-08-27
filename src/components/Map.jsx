import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useRef, useState } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode } from "../services/MapService";
import PathfindingState from "../models/PathfindingState";
import AStar from "../models/algorithms/AStar";
import Interface from "./Interface";
import { INITIAL_COLORS, INITIAL_VIEW_STATE, MAP_STYLE } from "../config";
import useSmoothStateChange from "../hooks/useSmoothStateChange";

function Map() {
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [selectionRadius, setSelectionRadius] = useState([]);
    const [tripsData, setTripsData] = useState([]);
    const [started, setStarted] = useState();
    const [time, setTime] = useState(0);
    const [animationEnded, setAnimationEnded] = useState(false);
    const [playbackOn, setPlaybackOn] = useState(false);
    const [playbackDirection, setPlaybackDirection] = useState(1);
    const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
    const [cinematic, setCinematic] = useState(false);
    const [placeEnd, setPlaceEnd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({ algorithm: "astar", radius: 4, speed: 5 });
    const [colors, setColors] = useState(INITIAL_COLORS);
    // Game mode state
    const [gameMode, setGameMode] = useState(false);
    const [playerRoute, setPlayerRoute] = useState([]);
    const [drawingRoute, setDrawingRoute] = useState(false);
    const [playerScore, setPlayerScore] = useState(null);
    const [gamePhase, setGamePhase] = useState("setup"); // setup, drawing, player-animation, algorithm-animation, complete
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const ui = useRef();
    const fadeRadius = useRef();
    const requestRef = useRef();
    const previousTimeRef = useRef();
    const timer = useRef(0);
    const waypoints = useRef([]);
    const playerWaypoints = useRef([]);
    const state = useRef(new PathfindingState());
    const traceNode = useRef(null);
    const traceNode2 = useRef(null);
    const selectionRadiusOpacity = useSmoothStateChange(0, 0, 1, 400, fadeRadius.current, fadeRadiusReverse);

    async function mapClick(e, info, radius = null) {
        if(started && !animationEnded) return;

        // Handle game mode route drawing
        if(gameMode && gamePhase === "drawing") {
            return handlePlayerRouteClick(e, info);
        }

        setFadeRadiusReverse(false);
        fadeRadius.current = true;
        clearPath();

        // Place end node
        if(info.rightButton || placeEnd) {
            if(e.layer?.id !== "selection-radius") {
                ui.current.showSnack("Please select a point inside the radius.", "info");
                return;
            }

            if(loading) {
                ui.current.showSnack("Please wait for all data to load.", "info");
                return;
            }

            const loadingHandle = setTimeout(() => {
                setLoading(true);
            }, 300);
            
            const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
            if(!node) {
                ui.current.showSnack("No path was found in the vicinity, please try another location.");
                clearTimeout(loadingHandle);
                setLoading(false);
                return;
            }

            const realEndNode = state.current.getNode(node.id);
            setEndNode(node);
            
            clearTimeout(loadingHandle);
            setLoading(false);

            if(!realEndNode) {
                ui.current.showSnack("An error occurred. Please try again.");
                return;
            }
            state.current.endNode = realEndNode;
            
            return;
        }

        const loadingHandle = setTimeout(() => {
            setLoading(true);
        }, 300);

        // Fectch nearest node
        const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
        if(!node) {
            ui.current.showSnack("No path was found in the vicinity, please try another location.");
            clearTimeout(loadingHandle);
            setLoading(false);
            return;
        }

        setStartNode(node);
        setEndNode(null);
        const circle = createGeoJSONCircle([node.lon, node.lat], radius ?? settings.radius);
        setSelectionRadius([{ contour: circle}]);
        
        // Fetch nodes inside the radius
        getMapGraph(getBoundingBoxFromPolygon(circle), node.id).then(graph => {
            state.current.graph = graph;
            clearPath();
            clearTimeout(loadingHandle);
            setLoading(false);
        });
    }

    // Start new pathfinding animation
    function startPathfinding() {
        setFadeRadiusReverse(true);
        setTimeout(() => {
            clearPath();
            state.current.start(settings.algorithm);
            setStarted(true);
        }, 400);
    }

    // Start or pause already running animation
    function toggleAnimation(loop = true, direction = 1) {
        if(time === 0 && !animationEnded) return;
        setPlaybackDirection(direction);
        if(animationEnded) {
            if(loop && time >= timer.current) {
                setTime(0);
            }
            setStarted(true);
            setPlaybackOn(!playbackOn);
            return;
        }
        setStarted(!started);
        if(started) {
            previousTimeRef.current = null;
        }
    }

    function clearPath() {
        setStarted(false);
        setTripsData([]);
        setTime(0);
        state.current.reset();
        waypoints.current = [];
        timer.current = 0;
        previousTimeRef.current = null;
        traceNode.current = null;
        traceNode2.current = null;
        setAnimationEnded(false);
        
        // Only clear game state if not in game mode
        if(!gameMode) {
            playerWaypoints.current = [];
            setPlayerRoute([]);
            setPlayerScore(null);
        }
    }

    // Game mode functions
    async function handlePlayerRouteClick(e, info) {
        if(e.layer?.id !== "selection-radius") {
            ui.current.showSnack("Please click inside the radius to draw your route.", "info");
            return;
        }

        const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
        if(!node) {
            ui.current.showSnack("No path found at this location.", "error");
            return;
        }

        const newRoute = [...playerRoute, node];
        setPlayerRoute(newRoute);

        // Check if we're close to the end node (within reasonable distance)
        if(endNode) {
            const distanceToEnd = Math.sqrt(
                Math.pow(node.lat - endNode.lat, 2) + 
                Math.pow(node.lon - endNode.lon, 2)
            );
            
            // If close enough to end node, finish the route
            if(distanceToEnd < 0.001 || node.id === endNode.id) { // About 100m tolerance
                // Ensure route ends exactly at the end node
                const endsWithCorrectNode = newRoute[newRoute.length - 1].id === endNode.id;
                console.log("Finishing route - ends with correct node?", endsWithCorrectNode);
                console.log("Last node in route:", newRoute[newRoute.length - 1].id, "Expected:", endNode.id);
                
                const finalRoute = endsWithCorrectNode ? newRoute : [...newRoute, endNode];
                console.log("Final route:", finalRoute.map(n => n.id));
                
                setPlayerRoute(finalRoute);
                finishPlayerRoute(finalRoute);
                ui.current.showSnack("Route completed! Watch the animations.", "success");
            }
        }
    }

    function finishPlayerRoute(route) {
        setGamePhase("player-animation");
        createPlayerWaypoints(route);
        animatePlayerRoute(route); // Pass the complete route directly
    }

    function createPlayerWaypoints(route, targetDuration = null) {
        playerWaypoints.current = [];
        
        console.log("Creating player waypoints:", {
            routeLength: route.length,
            startNode: route[0]?.id,
            endNode: route[route.length - 1]?.id,
            targetDuration,
            fullRoute: route.map(r => r.id)
        });
        
        // If we have a target duration, distribute time evenly across segments
        if(targetDuration && targetDuration > 0) {
            const segmentCount = route.length - 1;
            const segmentDuration = targetDuration / segmentCount;
            let currentTime = 0;
            
            for(let i = 0; i < segmentCount; i++) {
                const from = route[i];
                const to = route[i + 1];
                
                console.log(`Player segment ${i}: ${from.id} -> ${to.id}, time: ${currentTime.toFixed(0)}-${(currentTime + segmentDuration).toFixed(0)}`);
                console.log(`  Coords: [${from.lon.toFixed(4)}, ${from.lat.toFixed(4)}] -> [${to.lon.toFixed(4)}, ${to.lat.toFixed(4)}]`);
                
                playerWaypoints.current.push({
                    path: [[from.lon, from.lat], [to.lon, to.lat]],
                    timestamps: [currentTime, currentTime + segmentDuration],
                    color: "player"
                });
                
                currentTime += segmentDuration;
            }
            
            console.log(`Created ${playerWaypoints.current.length} player segments, final time: ${currentTime.toFixed(0)}, target: ${targetDuration.toFixed(0)}`);
            
            timer.current = targetDuration; // Set exact duration, don't use Math.max
        } else {
            // Original timing calculation for initial creation
            let currentTime = 0;
            
            for(let i = 0; i < route.length - 1; i++) {
                const from = route[i];
                const to = route[i + 1];
                const distance = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lon - from.lon, 2));
                const duration = distance * 50000;
                
                playerWaypoints.current.push({
                    path: [[from.lon, from.lat], [to.lon, to.lat]],
                    timestamps: [currentTime, currentTime + duration],
                    color: "player"
                });
                
                currentTime += duration;
            }
            
            timer.current = Math.max(timer.current, currentTime);
        }
    }

    function animatePlayerRoute(completeRoute = null) {
        setGamePhase("algorithm-animation");
        
        // Use the passed route or fall back to playerRoute state
        const routeToUse = completeRoute || playerRoute;
        console.log("Starting simultaneous animation with player route:", routeToUse.length, "points");
        
        // Store the current player route to prevent it from being cleared
        const savedPlayerRoute = [...routeToUse];
        console.log("Saved player route:", savedPlayerRoute.map(r => r.id));
        console.log("Expected end node:", endNode?.id);
        console.log("Route ends with correct node?", savedPlayerRoute[savedPlayerRoute.length - 1]?.id === endNode?.id);
        
        // Start algorithm without clearing game state
        setFadeRadiusReverse(true);
        setTimeout(() => {
            // Reset only algorithm state, preserve player state
            setStarted(false);
            setTime(0);
            state.current.reset();
            waypoints.current = [];
            timer.current = 0;
            previousTimeRef.current = null;
            traceNode.current = null;
            traceNode2.current = null;
            setAnimationEnded(false);
            
            // Start algorithm
            state.current.start(settings.algorithm);
            setStarted(true);
            
            // Restore player route after any potential clearing
            setPlayerRoute(savedPlayerRoute);
            
            // Wait for algorithm to generate waypoints then synchronize
            let checkCount = 0;
            const checkComplete = () => {
                checkCount++;
                console.log(`Check ${checkCount}: waypoints: ${waypoints.current.length}, timer: ${timer.current}, finished: ${state.current.finished}`);
                
                if(waypoints.current.length > 0 && timer.current > 0) {
                    console.log("Algorithm generated waypoints, synchronizing...");
                    // Use the saved route for synchronization
                    synchronizeAnimationTiming(savedPlayerRoute);
                } else if(checkCount > 25) { // 5 second timeout
                    console.log("Timeout waiting for algorithm, using fallback");
                    synchronizeAnimationTiming(savedPlayerRoute);
                } else {
                    setTimeout(checkComplete, 200);
                }
            };
            
            setTimeout(checkComplete, 500);
        }, 400);
    }
    
    function synchronizeAnimationTiming(savedPlayerRoute = null) {
        const routeToUse = savedPlayerRoute || playerRoute;
        
        // Calculate algorithm path duration (this is our target)
        let algorithmDuration = 0;
        for(const waypoint of waypoints.current) {
            algorithmDuration = Math.max(algorithmDuration, waypoint.timestamps[1]);
        }
        
        console.log("Synchronization check:", {
            algorithmWaypoints: waypoints.current.length,
            algorithmDuration: Math.round(algorithmDuration),
            timerCurrent: Math.round(timer.current),
            routeToUse: routeToUse.length,
            playerWaypointsBefore: playerWaypoints.current.length
        });
        
        if(algorithmDuration === 0) {
            console.log("Algorithm duration is 0, using fallback timing");
            algorithmDuration = 5000; // 5 second fallback
        }
        
        // Recreate player waypoints with algorithm duration to ensure perfect sync
        console.log("Recreating player waypoints with target duration:", algorithmDuration);
        console.log("Using route for synchronization:", routeToUse.map(r => r.id));
        createPlayerWaypoints(routeToUse, algorithmDuration);
        
        // Update timer and start synchronized animation
        timer.current = algorithmDuration;
        
        // Set trips data with both player and algorithm waypoints
        setTripsData([...playerWaypoints.current, ...waypoints.current]);
        
        setStarted(true);
        setTime(0);
        setAnimationEnded(false);
        
        console.log("Perfect synchronization:", {
            algorithmDuration: Math.round(algorithmDuration),
            playerSegments: playerWaypoints.current.length,
            algorithmSegments: waypoints.current.length,
            bothFinishAt: Math.round(algorithmDuration),
            totalTrips: playerWaypoints.current.length + waypoints.current.length
        });
    }

    async function calculatePlayerRoadPath(waypoints) {
        // Calculate actual road paths between player waypoints
        let fullRoadPath = [];
        let totalRoadDistance = 0;
        
        console.log("Calculating road paths between waypoints:", waypoints.map(w => w.id));
        
        for(let i = 0; i < waypoints.length - 1; i++) {
            const startWaypoint = waypoints[i];
            const endWaypoint = waypoints[i + 1];
            
            // Create a temporary pathfinding instance to find path between waypoints
            const tempState = new PathfindingState();
            tempState.graph = state.current.graph; // Use same graph
            tempState.endNode = state.current.graph.getNode(endWaypoint.id);
            
            // Use A* to find shortest path between waypoints
            const tempAlgorithm = new AStar();
            tempState.algorithm = tempAlgorithm;
            tempAlgorithm.start(state.current.graph.getNode(startWaypoint.id), tempState.endNode);
            
            // Run algorithm to completion with timeout protection
            let steps = 0;
            const maxSteps = 5000; // Reduce max steps for performance
            console.log(`Finding path from ${startWaypoint.id} to ${endWaypoint.id}...`);
            
            while(!tempAlgorithm.finished && steps < maxSteps) {
                tempAlgorithm.nextStep();
                steps++;
                
                // Log progress for long calculations
                if(steps % 1000 === 0) {
                    console.log(`  Step ${steps}/${maxSteps} for waypoint ${i}->${i+1}`);
                }
            }
            
            console.log(`Path calculation completed: ${steps} steps, finished: ${tempAlgorithm.finished}`);
            
            if(tempAlgorithm.finished && tempState.endNode.parent) {
                // Trace back the path
                let pathSegment = [];
                let segmentDistance = 0;
                let node = tempState.endNode;
                while(node && node.parent) {
                    pathSegment.unshift(node);
                    const parent = node.parent;
                    if(parent.latitude !== undefined && parent.longitude !== undefined) {
                        const stepDistance = Math.sqrt(
                            Math.pow(node.latitude - parent.latitude, 2) + 
                            Math.pow(node.longitude - parent.longitude, 2)
                        );
                        segmentDistance += stepDistance;
                        totalRoadDistance += stepDistance;
                    }
                    node = parent;
                }
                if(node) pathSegment.unshift(node); // Add start node
                
                // Add to full path (avoid duplicating connection nodes)
                if(i === 0) {
                    fullRoadPath.push(...pathSegment);
                } else {
                    fullRoadPath.push(...pathSegment.slice(1)); // Skip first node (already in path)
                }
                
                console.log(`Waypoint ${i}->${i+1}: ${pathSegment.length} nodes, ${Math.round(segmentDistance * 111139)}m`);
            } else {
                console.log(`Failed to find path between waypoint ${i} and ${i+1} (${steps} steps, finished: ${tempAlgorithm.finished})`);
                // Return partial result for performance - don't fail the entire calculation
                return {
                    roadPath: fullRoadPath,
                    totalDistance: totalRoadDistance,
                    totalNodes: fullRoadPath.length,
                    incomplete: true,
                    failedSegment: `${i}->${i+1}`
                };
            }
        }
        
        return {
            roadPath: fullRoadPath,
            totalDistance: totalRoadDistance,
            totalNodes: fullRoadPath.length
        };
    }

    function calculateScore() {
        if(!playerRoute.length || !state.current.endNode) {
            console.log("Score calculation failed: missing route or endNode", { 
                playerRouteLength: playerRoute.length, 
                hasEndNode: !!state.current.endNode 
            });
            return null;
        }
        
        // Simple approach: Check if player waypoints "hit" optimal path nodes
        console.log("Analyzing player waypoint coverage of optimal path...");
        
        // Calculate optimal route distance
        let optimalDistance = 0;
        let optimalPath = [];
        let node = state.current.endNode;
        
        console.log("Tracing optimal path from endNode:", {
            endNodeId: node?.id,
            hasParent: !!node?.parent,
            parentId: node?.parent?.id
        });
        
        // Build the optimal path
        let pathSteps = 0;
        while(node && node.parent && pathSteps < 1000) { // Safety limit
            const parent = node.parent;
            optimalPath.unshift(node); // Add to beginning
            
            // Debug node properties
            if(pathSteps === 0) {
                console.log("Node properties:", Object.keys(node));
                console.log("Parent properties:", Object.keys(parent));
                console.log("Node coords:", { lat: node.lat, lon: node.lon, x: node.x, y: node.y });
                console.log("Parent coords:", { lat: parent.lat, lon: parent.lon, x: parent.x, y: parent.y });
            }
            
            // Use correct property names: latitude/longitude
            const nodeLat = node.latitude;
            const nodeLon = node.longitude;  
            const parentLat = parent.latitude;
            const parentLon = parent.longitude;
            
            if(parentLat !== undefined && parentLon !== undefined && nodeLat !== undefined && nodeLon !== undefined) {
                const segmentDistance = Math.sqrt(Math.pow(nodeLat - parentLat, 2) + Math.pow(nodeLon - parentLon, 2));
                optimalDistance += segmentDistance;
                if(pathSteps < 3) console.log(`Path step ${pathSteps}: ${parent.id} -> ${node.id}, distance: ${segmentDistance}`);
            } else {
                console.log(`Missing coordinates at step ${pathSteps}:`, { nodeLat, nodeLon, parentLat, parentLon });
            }
            node = parent;
            pathSteps++;
        }
        if(node) optimalPath.unshift(node); // Add start node
        
        console.log(`Optimal path built: ${pathSteps} steps, total distance: ${optimalDistance}`);
        
        console.log("Score calculation:", { 
            optimalDistance, 
            playerRouteLength: playerRoute.length,
            optimalPathLength: optimalPath.length,
            algorithmFinished: state.current.finished
        });
        
        // Simple and efficient: Check waypoint coverage of optimal path
        const optimalNodeCount = optimalPath.length;
        const playerWaypointCount = playerRoute.length;
        
        // If no optimal path was found, show basic comparison
        if(optimalDistance === 0 || optimalNodeCount === 0) {
            return {
                efficiency: 100,
                playerNodes: playerWaypointCount,
                optimalNodes: optimalNodeCount,
                playerDistance: 0,
                optimalDistance: 0,
                waypoints: playerWaypointCount,
                note: "Algorithm path not found"
            };
        }
        
        // Check how many optimal nodes the player waypoints are close to
        let nodesHit = 0;
        const hitThreshold = 0.001; // ~100m tolerance in lat/lon degrees
        
        for(const optimalNode of optimalPath) {
            for(const playerWaypoint of playerRoute) {
                const distance = Math.sqrt(
                    Math.pow(optimalNode.latitude - playerWaypoint.lat, 2) + 
                    Math.pow(optimalNode.longitude - playerWaypoint.lon, 2)
                );
                if(distance <= hitThreshold) {
                    nodesHit++;
                    break; // Count each optimal node only once
                }
            }
        }
        
        // Path coverage efficiency: how much of optimal path did player hit
        const coverageEfficiency = Math.round((nodesHit / optimalNodeCount) * 100);
        
        // Granularity bonus: more waypoints = more detailed planning (up to reasonable limit)
        const granularityBonus = Math.min(10, Math.round(playerWaypointCount / 2)); // Max 10% bonus
        
        // Final efficiency with granularity bonus
        const finalEfficiency = Math.min(100, coverageEfficiency + granularityBonus);
        
        console.log("Waypoint coverage analysis:", {
            playerWaypoints: playerWaypointCount,
            optimalNodes: optimalNodeCount,
            nodesHit,
            coverageEfficiency: coverageEfficiency + "%",
            granularityBonus: granularityBonus + "%",
            finalEfficiency: finalEfficiency + "%",
            optimalDistanceM: Math.round(optimalDistance * 111139)
        });
        
        return {
            efficiency: finalEfficiency,
            coverageEfficiency,
            granularityBonus,
            playerNodes: playerWaypointCount,
            optimalNodes: optimalNodeCount,
            nodesHit,
            playerDistance: 0, // Not calculating player distance anymore
            optimalDistance: Math.round(optimalDistance * 111139),
            waypoints: playerWaypointCount
        };
    }

    function toggleGameMode() {
        setGameMode(!gameMode);
        setGamePhase("setup");
        clearPath();
    }

    function startGameRound() {
        if(!startNode || !endNode) {
            ui.current.showSnack("Please place start and end points first.", "info");
            return;
        }
        // Initialize player route with start node
        setPlayerRoute([startNode]);
        setGamePhase("drawing");
        ui.current.showSnack("Draw your route by clicking waypoints to the destination!", "info");
    }

    // Progress animation by one step
    function animateStep(newTime) {
        const updatedNodes = state.current.nextStep();
        for(const updatedNode of updatedNodes) {
            updateWaypoints(updatedNode, updatedNode.referer);
        }

        // Found end but waiting for animation to end
        if(state.current.finished && !animationEnded) {
            // Render route differently for bidirectional
            if(settings.algorithm === "bidirectional") {
                if(!traceNode.current) traceNode.current = updatedNodes[0];
                const parentNode = traceNode.current.parent;
                updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode.current = parentNode ?? traceNode.current;

                if(!traceNode2.current) {
                    traceNode2.current = updatedNodes[0];
                    traceNode2.current.parent = traceNode2.current.prevParent;
                }
                const parentNode2 = traceNode2.current.parent;
                updateWaypoints(parentNode2, traceNode2.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode2.current = parentNode2 ?? traceNode2.current;
                setAnimationEnded(time >= timer.current && parentNode == null && parentNode2 == null);
            }
            else {
                if(!traceNode.current) traceNode.current = state.current.endNode;
                const parentNode = traceNode.current.parent;
                updateWaypoints(parentNode, traceNode.current, "route", Math.max(Math.log2(settings.speed), 1));
                traceNode.current = parentNode ?? traceNode.current;
                setAnimationEnded(time >= timer.current && parentNode == null);
            }
        }

        // Animation progress
        if (previousTimeRef.current != null && !animationEnded) {
            const deltaTime = newTime - previousTimeRef.current;
            setTime(prevTime => (prevTime + deltaTime * playbackDirection));
        }

        // Playback progress
        if(previousTimeRef.current != null && animationEnded && playbackOn) {
            const deltaTime = newTime - previousTimeRef.current;
            if(time >= timer.current && playbackDirection !== -1) {
                setPlaybackOn(false);
            }
            setTime(prevTime => (Math.max(Math.min(prevTime + deltaTime * 2 * playbackDirection, timer.current), 0)));
        }
    }

    // Animation callback
    function animate(newTime) {
        for(let i = 0; i < settings.speed; i++) {
            animateStep(newTime);
        }

        previousTimeRef.current = newTime;
        requestRef.current = requestAnimationFrame(animate);
    }

    // Add new node to the waypoitns property and increment timer
    function updateWaypoints(node, refererNode, color = "path", timeMultiplier = 1) {
        if(!node || !refererNode) return;
        const distance = Math.hypot(node.longitude - refererNode.longitude, node.latitude - refererNode.latitude);
        const timeAdd = distance * 50000 * timeMultiplier;

        waypoints.current = [...waypoints.current,
            { 
                path: [[refererNode.longitude, refererNode.latitude], [node.longitude, node.latitude]],
                timestamps: [timer.current, timer.current + timeAdd],
                color,// timestamp: timer.current + timeAdd
            }
        ];

        timer.current += timeAdd;
        setTripsData(() => [...playerWaypoints.current, ...waypoints.current]);
    }

    function changeLocation(location) {
        setViewState({ ...viewState, longitude: location.longitude, latitude: location.latitude, zoom: 13,transitionDuration: 1, transitionInterpolator: new FlyToInterpolator()});
    }

    function changeSettings(newSettings) {
        setSettings(newSettings);
        const items = { settings: newSettings, colors };
        localStorage.setItem("path_settings", JSON.stringify(items));
    }

    function changeColors(newColors) {
        setColors(newColors);
        const items = { settings, colors: newColors };
        localStorage.setItem("path_settings", JSON.stringify(items));
    }

    function changeAlgorithm(algorithm) {
        clearPath();
        changeSettings({ ...settings, algorithm });
    }

    function changeRadius(radius) {
        changeSettings({...settings, radius});
        if(startNode) {
            mapClick({coordinate: [startNode.lon, startNode.lat]}, {}, radius);
        }
    }

    useEffect(() => {
        if(!started) return;
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [started, time, animationEnded, playbackOn]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(res => {
            changeLocation(res.coords);
        });

        const settings = localStorage.getItem("path_settings");
        if(!settings) return;
        const items = JSON.parse(settings);

        setSettings(items.settings);
        setColors(items.colors);
    }, []);

    // Calculate score when game animation ends
    useEffect(() => {
        if(gameMode && animationEnded && gamePhase === "algorithm-animation" && state.current.finished) {
            console.log("Calculating score:", { 
                gameMode, 
                animationEnded, 
                gamePhase, 
                playerRouteLength: playerRoute.length,
                hasEndNode: !!state.current.endNode,
                algorithmFinished: state.current.finished
            });
            
            // Calculate score synchronously
            const score = calculateScore();
            console.log("Score result:", score);
            setPlayerScore(score);
            setGamePhase("complete");
        }
    }, [animationEnded, gameMode, gamePhase, playerRoute, state.current.finished]);

    return (
        <>
            <div onContextMenu={(e) => { e.preventDefault(); }}>
                <DeckGL
                    initialViewState={viewState}
                    controller={{ doubleClickZoom: false, keyboard: false }}
                    onClick={mapClick}
                >
                    <PolygonLayer 
                        id={"selection-radius"}
                        data={selectionRadius}
                        pickable={true}
                        stroked={true}
                        getPolygon={d => d.contour}
                        getFillColor={[80, 210, 0, 10]}
                        getLineColor={[9, 142, 46, 175]}
                        getLineWidth={3}
                        opacity={selectionRadiusOpacity}
                    />
                    <TripsLayer
                        id={"pathfinding-layer"}
                        data={tripsData}
                        opacity={1}
                        widthMinPixels={3}
                        widthMaxPixels={5}
                        fadeTrail={false}
                        currentTime={time}
                        getColor={d => colors[d.color]}
                        /** Create a nice glowy effect that absolutely kills the performance  */
                        // getColor={(d) => {
                        //     if(d.color !== "path") return colors[d.color];
                        //     const color = colors[d.color];
                        //     const delta = Math.abs(time - d.timestamp);
                        //     return color.map(c => Math.max((c * 1.6) - delta * 0.1, c));
                        // }}
                        updateTriggers={{
                            getColor: [colors.path, colors.route, colors.player]
                        }}
                    />
                    <ScatterplotLayer 
                        id="start-end-points"
                        data={[
                            ...(startNode ? [{ coordinates: [startNode.lon, startNode.lat], color: colors.startNodeFill, lineColor: colors.startNodeBorder }] : []),
                            ...(endNode ? [{ coordinates: [endNode.lon, endNode.lat], color: colors.endNodeFill, lineColor: colors.endNodeBorder }] : []),
                            ...(gameMode ? playerRoute.map((node, index) => ({ 
                                coordinates: [node.lon, node.lat], 
                                color: colors.player, 
                                lineColor: [255, 255, 255],
                                id: `player-${index}`
                            })) : []),
                        ]}
                        pickable={true}
                        opacity={1}
                        stroked={true}
                        filled={true}
                        radiusScale={1}
                        radiusMinPixels={7}
                        radiusMaxPixels={20}
                        lineWidthMinPixels={1}
                        lineWidthMaxPixels={3}
                        getPosition={d => d.coordinates}
                        getFillColor={d => d.color}
                        getLineColor={d => d.lineColor}
                    />
                    <MapGL 
                        reuseMaps mapLib={maplibregl} 
                        mapStyle={MAP_STYLE} 
                        doubleClickZoom={false}
                    />
                </DeckGL>
            </div>
            <Interface 
                ref={ui}
                canStart={startNode && endNode}
                started={started}
                animationEnded={animationEnded}
                playbackOn={playbackOn}
                time={time}
                startPathfinding={startPathfinding}
                toggleAnimation={toggleAnimation}
                clearPath={clearPath}
                timeChanged={setTime}
                changeLocation={changeLocation}
                maxTime={timer.current}
                settings={settings}
                setSettings={changeSettings}
                changeAlgorithm={changeAlgorithm}
                colors={colors}
                setColors={changeColors}
                loading={loading}
                cinematic={cinematic}
                setCinematic={setCinematic}
                placeEnd={placeEnd}
                setPlaceEnd={setPlaceEnd}
                changeRadius={changeRadius}
                gameMode={gameMode}
                gamePhase={gamePhase}
                playerScore={playerScore}
                playerRoute={playerRoute}
                endNode={endNode}
                toggleGameMode={toggleGameMode}
                startGameRound={startGameRound}
                finishPlayerRoute={finishPlayerRoute}
                setPlayerRoute={setPlayerRoute}
            />
            <div className="attrib-container"><summary className="maplibregl-ctrl-attrib-button" title="Toggle attribution" aria-label="Toggle attribution"></summary><div className="maplibregl-ctrl-attrib-inner">© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors</div></div>
        </>
    );
}

export default Map;