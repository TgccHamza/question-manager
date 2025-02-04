"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, X, Upload, FileJson, GripVertical, Shuffle, Save, RefreshCw } from "lucide-react"

const URL_MONGO = "https://dev-api.thegamechangercompany.io/api"

interface Question {
  id: string
  number: number
  text: string
  type: "single-choice" | "open-ended"
  options: string[]
  answer: string[]
  points: number
  reveal_answer: string
}

interface GameData {
  quiz: string
  total_questions: number
  questions: Question[]
  game_start_at: string | null
  game_end_at: string | null
  is_paused: boolean
  paused_at: string | null
  question_start_at: string | null
  question_end_at: string | null
  current_question: number
  duration: number
  logs: any[]
}

export default function QuestionManager() {
  const [dbIndex, setDbIndex] = useState<string>("")
  const [gameData, setGameData] = useState<GameData>({
    quiz: "",
    total_questions: 0,
    questions: [],
    game_start_at: null,
    game_end_at: null,
    is_paused: true,
    paused_at: null,
    question_start_at: null,
    question_end_at: null,
    current_question: -1,
    duration: 30,
    logs: [],
  })
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [jsonInput, setJsonInput] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dbIndex) {
      fetchGameData()
    }
  }, [dbIndex])

  const fetchGameData = async () => {
    try {
      const response = await fetch(`${URL_MONGO}/game/${dbIndex}/game-data`)
      if (!response.ok) {
        throw new Error("Failed to fetch game data")
      }
      const data = await response.json()
      setGameData(data)
    } catch (error) {
      console.error("Error fetching game data:", error)
      alert("Failed to fetch game data. Please check the console for more details.")
    }
  }

  const updateGameData = async () => {
    try {
      const response = await fetch(`${URL_MONGO}/game/${dbIndex}/put-game-data`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      })
      if (!response.ok) {
        throw new Error("Failed to update game data")
      }
      alert("Game data updated successfully!")
    } catch (error) {
      console.error("Error updating game data:", error)
      alert("Failed to update game data. Please check the console for more details.")
    }
  }

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestion({ ...question })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedQuestion) {
      const value = e.target.name === "answer" ? [e.target.value] : e.target.value
      setSelectedQuestion({
        ...selectedQuestion,
        [e.target.name]: value,
      })
    }
  }

  const handleGameDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGameData((prevData) => ({
      ...prevData,
      [name]: name === "duration" ? Number.parseInt(value) : value,
    }))
  }

  const handleTypeChange = (value: string) => {
    if (selectedQuestion) {
      setSelectedQuestion({
        ...selectedQuestion,
        type: value as "single-choice" | "open-ended",
        options: value === "open-ended" ? [] : selectedQuestion.options,
        answer: [],
      })
    }
  }

  const handleOptionAdd = () => {
    if (selectedQuestion) {
      setSelectedQuestion({
        ...selectedQuestion,
        options: [...selectedQuestion.options, ""],
      })
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    if (selectedQuestion) {
      const newOptions = [...selectedQuestion.options]
      newOptions[index] = value
      setSelectedQuestion({
        ...selectedQuestion,
        options: newOptions,
      })
    }
  }

  const handleOptionRemove = (index: number) => {
    if (selectedQuestion) {
      const newOptions = selectedQuestion.options.filter((_, i) => i !== index)
      setSelectedQuestion({
        ...selectedQuestion,
        options: newOptions,
        answer: selectedQuestion.answer.filter((ans) => newOptions.includes(ans)),
      })
    }
  }

  const handleAnswerChange = (option: string, isChecked: boolean) => {
    if (selectedQuestion) {
      let newAnswer: string[]
      if (isChecked) {
        newAnswer = [...selectedQuestion.answer, option]
      } else {
        newAnswer = selectedQuestion.answer.filter((ans) => ans !== option)
      }
      setSelectedQuestion({
        ...selectedQuestion,
        answer: newAnswer,
      })
    }
  }

  const handleOpenEndedAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedQuestion) {
      setSelectedQuestion({
        ...selectedQuestion,
        answer: e.target.value.split("\n").filter((ans) => ans.trim() !== ""),
      })
    }
  }

  const updateQuestionNumbers = (questionsToUpdate: Question[]) => {
    return questionsToUpdate.map((q, index) => ({
      ...q,
      number: index + 1,
    }))
  }

  const handleCreate = () => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      number: gameData.questions.length + 1,
      text: "",
      type: "single-choice",
      options: [],
      answer: [],
      points: 0,
      reveal_answer: "",
    }
    const updatedQuestions = [...gameData.questions, newQuestion]
    setGameData((prevData) => ({
      ...prevData,
      questions: updateQuestionNumbers(updatedQuestions),
      total_questions: updatedQuestions.length,
    }))
    setSelectedQuestion(newQuestion)
  }

  const handleSave = () => {
    if (selectedQuestion) {
      const updatedQuestions = gameData.questions.map((q) => (q.id === selectedQuestion.id ? selectedQuestion : q))
      setGameData((prevData) => ({
        ...prevData,
        questions: updateQuestionNumbers(updatedQuestions),
        total_questions: updatedQuestions.length,
      }))
      setSelectedQuestion(null)
    }
  }

  const handleDelete = () => {
    if (selectedQuestion) {
      const updatedQuestions = gameData.questions.filter((q) => q.id !== selectedQuestion.id)
      setGameData((prevData) => ({
        ...prevData,
        questions: updateQuestionNumbers(updatedQuestions),
        total_questions: updatedQuestions.length,
      }))
      setSelectedQuestion(null)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(gameData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "game_data.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          if (json.questions && Array.isArray(json.questions)) {
            setGameData((prevData) => ({
              ...prevData,
              ...json,
              questions: updateQuestionNumbers(
                json.questions.map((q: Question) => ({ ...q, id: `question_${Date.now()}_${Math.random()}` })),
              ),
              total_questions: json.questions.length,
            }))
          } else {
            alert('Invalid JSON format. Expected an object with a "questions" array.')
          }
        } catch (error) {
          alert("Error parsing JSON file. Please make sure it's a valid JSON.")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value)
  }

  const handleJsonImport = () => {
    try {
      const json = JSON.parse(jsonInput)
      if (json.questions && Array.isArray(json.questions)) {
        setGameData((prevData) => ({
          ...prevData,
          ...json,
          questions: updateQuestionNumbers(
            json.questions.map((q: Question) => ({ ...q, id: `question_${Date.now()}_${Math.random()}` })),
          ),
          total_questions: json.questions.length,
        }))
        setJsonInput("")
      } else {
        alert('Invalid JSON format. Expected an object with a "questions" array.')
      }
    } catch (error) {
      alert("Error parsing JSON. Please make sure it's a valid JSON.")
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const items = Array.from(gameData.questions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setGameData((prevData) => ({
      ...prevData,
      questions: updateQuestionNumbers(items),
    }))
  }

  const randomizeQuestions = () => {
    const shuffled = [...gameData.questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setGameData((prevData) => ({
      ...prevData,
      questions: updateQuestionNumbers(shuffled),
    }))
  }

  const sortQuestions = (criteria: "number" | "text" | "points") => {
    const sorted = [...gameData.questions].sort((a, b) => {
      if (criteria === "number") {
        return a.number - b.number
      } else if (criteria === "text") {
        return a.text.localeCompare(b.text)
      } else if (criteria === "points") {
        return b.points - a.points // Sort points in descending order
      }
      return 0
    })
    setGameData((prevData) => ({
      ...prevData,
      questions: updateQuestionNumbers(sorted),
    }))
  }

  return (
    <div className="container mx-auto p-4 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Question Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="dbIndex">DB Index</Label>
          <Input
            id="dbIndex"
            value={dbIndex}
            onChange={(e) => setDbIndex(e.target.value)}
            placeholder="Enter DB Index"
          />
        </div>
        <div>
          <Label htmlFor="quiz">Quiz Title</Label>
          <Input
            id="quiz"
            name="quiz"
            value={gameData.quiz}
            onChange={handleGameDataChange}
            placeholder="Enter Quiz Title"
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            name="duration"
            type="number"
            value={gameData.duration}
            onChange={handleGameDataChange}
            placeholder="Enter Duration"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Questions List</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {gameData.questions.map((question, index) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center space-x-2 p-2 rounded-md ${
                              snapshot.isDragging ? "bg-accent shadow-lg" : "bg-background"
                            }`}
                          >
                            <span {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            </span>
                            <Button
                              variant="ghost"
                              className="w-full justify-start font-normal truncate"
                              onClick={() => handleQuestionSelect(question)}
                            >
                              {question.number}. {question.text}
                            </Button>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button onClick={handleCreate}>Create New Question</Button>
              <Select onValueChange={(value) => sortQuestions(value as "number" | "text" | "points")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Sort by Number</SelectItem>
                  <SelectItem value="text">Sort by Text</SelectItem>
                  <SelectItem value="points">Sort by Points</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={randomizeQuestions} variant="outline">
                <Shuffle className="mr-2 h-4 w-4" />
                Randomize
              </Button>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Import Questions</DialogTitle>
                  <DialogDescription>Upload a JSON file or paste JSON text to import questions.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload JSON File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      style={{ display: "none" }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="json-input">Or paste JSON here:</Label>
                    <Textarea
                      id="json-input"
                      value={jsonInput}
                      onChange={handleJsonInputChange}
                      placeholder='{"questions": [...]}'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJsonImport} disabled={!jsonInput.trim()}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Import from Text
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {selectedQuestion && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    name="number"
                    value={selectedQuestion.number}
                    onChange={handleInputChange}
                    type="number"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="text">Question Text</Label>
                  <Textarea id="text" name="text" value={selectedQuestion.text} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={selectedQuestion.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-choice">Single Choice</SelectItem>
                      <SelectItem value="open-ended">Open Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedQuestion.type === "single-choice" && (
                  <div>
                    <Label>Options (Select all correct answers)</Label>
                    {selectedQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={selectedQuestion.answer.includes(option)}
                          onCheckedChange={(checked) => handleAnswerChange(option, checked as boolean)}
                        />
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-grow"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOptionRemove(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleOptionAdd}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                )}
                {selectedQuestion.type === "open-ended" && (
                  <div>
                    <Label htmlFor="answer">Correct Answer(s) (one per line)</Label>
                    <Textarea
                      id="answer"
                      name="answer"
                      value={selectedQuestion.answer.join("\n")}
                      onChange={handleOpenEndedAnswerChange}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    name="points"
                    value={selectedQuestion.points}
                    onChange={handleInputChange}
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="reveal_answer">Reveal Answer</Label>
                  <Textarea
                    id="reveal_answer"
                    name="reveal_answer"
                    value={selectedQuestion.reveal_answer}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} className="mr-2">
                Save Changes
              </Button>
              <Button onClick={handleDelete} variant="destructive">
                Delete Question
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <div className="mt-4 flex space-x-2">
        <Button onClick={handleExport}>Export JSON</Button>
        <Button onClick={updateGameData}>
          <Save className="mr-2 h-4 w-4" />
          Save to API
        </Button>
        <Button onClick={fetchGameData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh from API
        </Button>
      </div>
    </div>
  )
}

