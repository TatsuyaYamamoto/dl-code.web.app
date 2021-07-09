import { logger } from "firebase-functions";

import { sendToSlack } from "../utils/slack";
import type { Message } from "firebase-functions/lib/providers/pubsub";
import type { EventContext } from "firebase-functions/lib/cloud-functions";

const cloudFunctionsErrorLog = async (
  message: Message,
  context: EventContext
) => {
  try {
    const data = JSON.parse(new Buffer(message.data, "base64").toString());
    const { function_name, project_id } = data.resource.labels;
    const executionId = context.eventId;

    const logUrl =
      `https://logger.cloud.google.com/logs/viewer` +
      `?project=${project_id}` +
      `&advancedFilter=labels."execution_id"%3D"${executionId}"`;

    const title = `Catch unhandled error! *${function_name}* <${logUrl}|Open log>`;
    const text = JSON.stringify(data, null, "\t");
    const result = await sendToSlack({
      title,
      text,
      color: "danger",
    });

    logger.log(
      `it's success to send slack message. slack text: ${result.text}, pubsub message: ${message}, context: ${context}`
    );
  } catch (e) {
    logger.info("FATAL ERROR! Could not send slack webhook!", e);
  }
};

export default cloudFunctionsErrorLog;
