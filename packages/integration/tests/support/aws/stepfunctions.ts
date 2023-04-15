import {
  SFNClient,
  ListExecutionsCommand,
  ListStateMachinesCommand,
  ExecutionStatus,
  ExecutionListItem,
  DescribeExecutionCommand,
} from "@aws-sdk/client-sfn";
import { AWSConfig } from "./common";

const client = new SFNClient(AWSConfig);
const listStateMachines = new ListStateMachinesCommand({});

export const getStateMachineName = async () => {
  const { stateMachines } = await client.send(listStateMachines);

  const prNumber = process.env.PR_NUMBER;

  if (prNumber) {
    return stateMachines?.find((sm) => sm.name?.includes(prNumber))?.name;
  } else {
    return "carto-bot-workflow"; // Default name
  }
};

export const getExecutionOutput = async (
  stateMachineName: string,
  timeout = 3000
) => {
  const { stateMachines } = await client.send(listStateMachines);

  if (!stateMachines) throw new Error("No state machines found");

  const stateMachine = stateMachines.find((sm) => sm.name === stateMachineName);

  if (!stateMachine)
    throw new Error(`State machine ${stateMachineName} not found`);

  const listExecutions = new ListExecutionsCommand({
    stateMachineArn: stateMachine.stateMachineArn,
    maxResults: 1,
  });

  let status: string | undefined;
  let executions: ExecutionListItem[] = [];

  do {
    const executionList = await client.send(listExecutions);

    if (!executionList.executions) break;

    executions = executionList.executions;

    status = executions[0].status;

    await new Promise((r) => setTimeout(r, timeout));
  } while (status === ExecutionStatus.RUNNING);

  const describeExecution = new DescribeExecutionCommand({
    executionArn: executions[0].executionArn,
  });

  return client.send(describeExecution);
};
