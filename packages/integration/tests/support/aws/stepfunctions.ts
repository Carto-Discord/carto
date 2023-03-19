import {
  SFNClient,
  ListExecutionsCommand,
  ListStateMachinesCommand,
  ExecutionStatus,
  ExecutionListItem,
  DescribeExecutionCommand,
} from "@aws-sdk/client-sfn";
import { AWSConfig } from "./common";

export const getExecutionOutput = async (
  stateMachineName: string,
  timeout = 3000
) => {
  const client = new SFNClient(AWSConfig);
  const listStateMachines = new ListStateMachinesCommand({});

  const { stateMachines } = await client.send(listStateMachines);

  const { stateMachineArn } = stateMachines.find(
    (sm) => sm.name === stateMachineName
  );

  const listExecutions = new ListExecutionsCommand({
    stateMachineArn,
    maxResults: 1,
  });

  let status: string;
  let executions: ExecutionListItem[] = [];

  do {
    ({ executions } = await client.send(listExecutions));

    status = executions[0].status;

    await new Promise((r) => setTimeout(r, timeout));
  } while (status === ExecutionStatus.RUNNING);

  const describeExecution = new DescribeExecutionCommand({
    executionArn: executions[0].executionArn,
  });

  return client.send(describeExecution);
};
