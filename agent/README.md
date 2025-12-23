# Trip Research Agentic Workflow

This project implements a LangGraph-powered agentic workflow for researching travel destinations.

## Architecture

The workflow consists of the following agents:

1.  **Pre-research Agent**: Determines the relevant research categories (Interests) for the destination if not provided by the user.
2.  **Analyst Agents** (Parallel):
    *   Culture Analyst
    *   Food Analyst
    *   Entertainment Analyst
    *   Activities Analyst
    *   Wildlife Analyst
3.  **Summarizing Agent**: Aggregates the research from all analysts into a final report.

## Setup

1.  Navigate to the `agent` directory:
    ```bash
    cd agent
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Configure Environment Variables:
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Edit `.env` and add your `OPENAI_API_KEY`.

## Usage

Run the main script:

```bash
python main.py
```

By default, it is configured to research "Kyoto, Japan" in `main.py`. You can modify the `inputs` dictionary in the `if __name__ == "__main__":` block to change the destination or specify interests.
