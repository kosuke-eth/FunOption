import { EndedPrediction } from "./interfaces";

interface EndedPredictionRowProps {
  prediction: EndedPrediction;
}

export function EndedPredictionRow({ prediction }: EndedPredictionRowProps) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {prediction.range}
        </div>
        <div className="text-sm text-gray-500">{prediction.shares}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            prediction.result === "Win"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {prediction.result}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {prediction.avg}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {prediction.bet}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {prediction.value}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {prediction.date}
      </td>
    </tr>
  );
}
