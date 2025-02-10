import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user.context';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
const Markdown = React.lazy(() => import('markdown-to-jsx'));
const hljs = React.lazy(() => import('highlight.js'));
import { getWebContainer } from '../config/webcontainer';

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && props.className?.includes('lang-') && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute('data-highlighted');
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState('');
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  function addCollaborators() {
    axios
      .put('/projects/add-user', {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const send = () => {
    sendMessage('project-message', {
      message,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
    setMessage('');
  };

  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message);
    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log('container started');
      });
    }

    receiveMessage('project-message', (data) => {
      if (data.sender._id === 'ai') {
        const message = JSON.parse(data.message);
        webContainer?.mount(message.fileTree);
        if (message.fileTree) {
          setFileTree(message.fileTree || {});
        }
        setMessages((prevMessages) => [...prevMessages, data]);
      } else {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        setFileTree(res.data.project.fileTree || {});
      });

    axios
      .get('/users/all')
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function saveFileTree(ft) {
    axios
      .put('/projects/update-file-tree', {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function deleteFile(fileName) {
    const updatedFileTree = { ...fileTree };
    delete updatedFileTree[fileName];
    setFileTree(updatedFileTree);
    saveFileTree(updatedFileTree);
  }


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      send();
    }
  };

  const saveProject = () => {
    setIsSaving(true);
    axios
      .put('/projects/save-project', {
        projectId: project._id,
        fileTree,
        projectData: project,
      })
      .then(() => {
        console.log('Project saved successfully');
        setIsSaving(false);
      })
      .catch((err) => {
        console.log('Error saving project:', err);
        setIsSaving(false);
      });
  };

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0 shadow-lg">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add collaborator</p>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2 hover:bg-slate-200 rounded-lg transition duration-200"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative bg-gradient-to-b from-slate-50 to-slate-100">
          <div
            ref={messageBox}
            className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'
                } ${
                  msg.sender._id == user._id.toString() && 'ml-auto'
                } message flex flex-col p-2 bg-slate-50 w-fit rounded-md shadow-sm`}
              >
                <small className="opacity-65 text-xs">{msg.sender.email}</small>
                <div className="text-sm">
                  {msg.sender._id === 'ai' ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="inputField w-full flex absolute bottom-0">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="p-2 px-4 border-none outline-none flex-grow rounded-l-md"
              type="text"
              placeholder="Enter message"
            />
            <button
              onClick={send}
              className="px-5 bg-slate-950 text-white rounded-r-md hover:bg-slate-800 transition"
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
        <div
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${
            isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
          } top-0 shadow-lg`}
        >
          <header className="flex justify-between items-center px-4 p-2 bg-slate-200">
            <h1 className="font-semibold text-lg">Collaborators</h1>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-2 hover:bg-slate-200 rounded-md transition duration-200"
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2 p-2">
            {project.users &&
              project.users.map((user) => (
                <div
                  key={user._id}
                  className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center rounded-md transition duration-200"
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="right bg-red-50 flex-grow h-full flex">
        <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
          <div className="file-tree w-full">
            {Object.keys(fileTree).map((file, index) => (
              <div key={index} className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentFile(file);
                    setOpenFiles([...new Set([...openFiles, file])]);
                  }}
                  className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full rounded-md hover:bg-slate-400 transition duration-200"
                >
                  <p className="font-semibold text-lg">{file}</p>
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  className="p-2 bg-red-600 text-white rounded-md ml-2 hover:bg-red-500 transition duration-200 ease-in-out transform hover:scale-105"
                >
                 <i class="ri-delete-bin-6-line"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="code-editor flex flex-col flex-grow h-full shrink">
          <div className="top flex justify-between w-full">
            <div className="files flex">
              {openFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFile(file)}
                  className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${
                    currentFile === file ? 'bg-slate-400' : ''
                  }`}
                >
                  <p className="font-semibold text-lg">{file}</p>
                </button>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={async () => {
                  await webContainer.mount(fileTree);
                  const installProcess = await webContainer.spawn('npm', [
                    'install',
                  ]);
                  installProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    })
                  );
                  if (runProcess) {
                    runProcess.kill();
                  }

                  let tempRunProcess = await webContainer.spawn('npm', [
                    'start',
                  ]);

                  tempRunProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    })
                  );

                  setRunProcess(tempRunProcess);

                  webContainer.on('server-ready', (port, url) => {
                    console.log(port, url);
                    setIframeUrl(url);
                  });
                }}
                className="p-2 px-4 bg-slate-300 text-white rounded-md hover:bg-slate-400 transition"
              >
                Run
              </button>
              <button
                onClick={saveProject}
                className="p-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-400 transition"
              >
                {isSaving ? 'Saving...' : 'Save Project'}
              </button>
            </div>

          </div>
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
            {fileTree[currentFile] && (
              <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                <pre className="hljs h-full">
                  <code
                    className="hljs h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText;
                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent,
                          },
                        },
                      };
                      setFileTree(ft);
                      saveFileTree(ft);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs
                        .highlight('javascript', fileTree[currentFile].file.contents)
                        .value,
                    }}
                    style={{
                      whiteSpace: 'pre-wrap',
                      paddingBottom: '25rem',
                      counterSet: 'line-numbering',
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && webContainer && (
          <div className="flex min-w-96 flex-col h-full">
            <div className="address-bar">
              <input
                type="text"
                onChange={(e) => setIframeUrl(e.target.value)}
                value={iframeUrl}
                className="w-full p-2 px-4 bg-slate-200"
              />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>
        )}
      </section>

     {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out">
    <div className="bg-white p-6 rounded-lg w-96 max-w-full relative shadow-lg transform transition-all duration-300 ease-in-out">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Select Users</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setIsModalOpen(false)}
        >
          <i className="ri-close-circle-line text-xl"></i>
        </button>
      </header>

      <div className="overflow-auto max-h-60 mb-4">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user._id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                onChange={() => handleUserClick(user._id)}
                checked={selectedUserId.has(user._id)}
                className="h-5 w-5 text-blue-500 focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-gray-700 font-medium">{user.email}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition"
          onClick={addCollaborators}
        >
          Add Collaborators
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
};

export default Project;
