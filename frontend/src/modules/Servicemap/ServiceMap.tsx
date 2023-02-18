/* eslint-disable  */
//@ts-nocheck

import { Card } from 'antd';
import Spinner from 'components/Spinner';
import { useIsDarkMode } from 'hooks/useDarkMode';
import React, { useEffect, useRef } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { getDetailedServiceMapItems, ServiceMapStore } from 'store/actions';
import { AppState } from 'store/reducers';
import styled from 'styled-components';
import { GlobalTime } from 'types/actions/globalTime';

import { getGraphData, getTooltip, getZoomPx, transformLabel } from './utils';

const Container = styled.div`
	.force-graph-container {
		overflow: scroll;
	}

	.force-graph-container .graph-tooltip {
		background: black;
		padding: 1px;
		.keyval {
			display: flex;
			.key {
				margin-right: 4px;
			}
			.val {
				margin-left: auto;
			}
		}
	}
`;

interface ServiceMapProps extends RouteComponentProps<any> {
	serviceMap: ServiceMapStore;
	globalTime: GlobalTime;
	getDetailedServiceMapItems: (time: GlobalTime) => void;
}
interface graphNode {
	id: string;
	group: number;
}
interface graphLink {
	source: string;
	target: string;
	value: number;
	callRate: number;
	errorRate: number;
	p99: number;
}
export interface graphDataType {
	nodes: graphNode[];
	links: graphLink[];
}

function ServiceMap(props: ServiceMapProps): JSX.Element {
	const fgRef = useRef();

	const isDarkMode = useIsDarkMode();

	const { getDetailedServiceMapItems, globalTime, serviceMap } = props;

	useEffect(() => {
		/*
			Call the apis only when the route is loaded.
			Check this issue: https://github.com/SigNoz/signoz/issues/110
		 */
		getDetailedServiceMapItems(globalTime);
	}, [globalTime, getDetailedServiceMapItems]);

	useEffect(() => {
		fgRef.current && fgRef.current.d3Force('charge').strength(-400);
	});

	if (serviceMap.loading) {
		return <Spinner size="large" tip="Loading..." />;
	}

	if (!serviceMap.loading && serviceMap.items.length === 0) {
		return (
			<Container>
				<Card>No Service Found</Card>
			</Container>
		);
	}

	const { nodes, links } = getGraphData(serviceMap, isDarkMode);
	const graphData = { nodes, links };
	return (
		<Container>
			<ForceGraph2D
				ref={fgRef}
				cooldownTicks={100}
				graphData={graphData}
				linkLabel={getTooltip}
				linkAutoColorBy={(d) => d.target}
				linkDirectionalParticles="value"
				linkDirectionalParticleSpeed={(d) => d.value}
				nodeCanvasObject={(node, ctx) => {
					const label = transformLabel(node.id);
					const { fontSize } = node;
					ctx.font = `${fontSize}px Roboto`;
					const { width } = node;

					ctx.fillStyle = node.color;
					ctx.beginPath();
					ctx.arc(node.x, node.y, width, 0, 2 * Math.PI, false);
					ctx.fill();
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
					ctx.fillText(label, node.x, node.y);
				}}
				onLinkHover={(node) => {
					const tooltip = document.querySelector('.graph-tooltip');
					if (tooltip && node) {
						tooltip.innerHTML = getTooltip(node);
					}
				}}
				nodePointerAreaPaint={(node, color, ctx) => {
					ctx.fillStyle = color;
					ctx.beginPath();
					ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
					ctx.fill();
				}}
			/>
		</Container>
	);
}

const mapStateToProps = (
	state: AppState,
): {
	serviceMap: serviceMapStore;
	globalTime: GlobalTime;
} => ({
	serviceMap: state.serviceMap,
	globalTime: state.globalTime,
});

export default withRouter(
	connect(mapStateToProps, {
		getDetailedServiceMapItems,
	})(ServiceMap),
);
