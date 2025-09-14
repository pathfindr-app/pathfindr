import PathfindingAlgorithm from "./PathfindingAlgorithm";

class AStar extends PathfindingAlgorithm {
    constructor() {
        super();
        this.openList = [];
        this.closedList = [];
    }

    start(startNode, endNode) {
        super.start(startNode, endNode);
        this.openList = [this.startNode];
        this.closedList = [];
        this.startNode.distanceFromStart = 0;
        this.startNode.distanceToEnd = 0;
    }

    nextStep() {
        if(this.openList.length === 0) {
            this.finished = true;
            return [];
        }

        const updatedNodes = [];
        const currentNode = this.openList.reduce((acc, current) => current.totalDistance < acc.totalDistance ? current : acc, this.openList[0]);
        this.openList.splice(this.openList.indexOf(currentNode), 1);
        currentNode.visited = true;
        const refEdge = currentNode.edges.find(e => e.getOtherNode(currentNode) === currentNode.referer);
        if(refEdge) refEdge.visited = true;

        updatedNodes.push(currentNode);
        this.closedList.push(currentNode);
        
        if(currentNode.id === this.endNode.id) {
            this.finished = true;
            return updatedNodes;
        }

        for(const edge of currentNode.edges) {
            const neighbor = edge.getOtherNode(currentNode);

            if(neighbor.visited) continue;

            const newDistanceFromStart = currentNode.distanceFromStart + edge.cost;
            let shouldUpdate = !this.openList.includes(neighbor);

            if(this.openList.includes(neighbor) && newDistanceFromStart >= neighbor.distanceFromStart) continue;

            neighbor.referer = currentNode;
            neighbor.distanceFromStart = newDistanceFromStart;
            neighbor.distanceToEnd = neighbor.getDistanceTo(this.endNode);

            if(shouldUpdate) {
                this.openList.push(neighbor);
            }

            updatedNodes.push(neighbor);
        }

        return updatedNodes;
    }

    // REFERENCE: Original A* algorithm from React version
    // Key implementation details for Unity port:
    // 1. Open/closed list management
    // 2. Distance calculations (distanceFromStart + heuristic)
    // 3. Node referencing for path reconstruction
    // 4. Step-by-step processing for animation
}

export default AStar;