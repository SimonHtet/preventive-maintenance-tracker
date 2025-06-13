
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Task, TaskStatus, UserRole, User, SparePart } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetailView from './components/TaskDetailView';
import SummaryView from './components/SummaryView';
import LoginScreen from './components/LoginScreen';
import { UserManagement } from './components/UserManagement';
import CalendarView from './components/CalendarView';
import AwaitingSupervisorConfirmationList from './components/AwaitingSupervisorConfirmationList';
import AwaitingManagerConfirmationList from './components/AwaitingManagerConfirmationList';
import { APP_NAME } from './constants';
import { supabase } from './services/supabaseClient';
import Button from './components/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading authentication...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (allowedRoles.includes(UserRole.CREATOR) && currentUser.role === UserRole.OWNER) {
      // Allow if OWNER is present and CREATOR was in allowedRoles
    } else {
      return <Navigate to="/tasks" replace />;
    }
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentUser, users: allUsersFromAuth, isAuthLoading: isAuthContextLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sparePartsCatalog, setSparePartsCatalog] = useState<SparePart[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [sparePartsError, setSparePartsError] = useState<string | null>(null);

  const allUsers = allUsersFromAuth as User[];

  const fetchTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    setTasksError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('plan_date', { ascending: true });

      if (fetchError) {
        setTasksError('Failed to load tasks. Please try again later.');
        setTasks([]);
        console.error('Error fetching tasks:', fetchError.message);
      } else {
        setTasks(data as Task[]);
      }
    } catch (err: any) {
      setTasksError('Unexpected error occurred while loading tasks.');
      setTasks([]);
      console.error('Unexpected error fetching tasks:', err.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const fetchSparePartsCatalog = useCallback(async () => {
    setIsLoadingSpareParts(true);
    setSparePartsError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('spare_parts')
        .select('id, machine_name, machine_part, serial_number'); // Fetch all relevant fields

      if (fetchError) {
        setSparePartsError('Failed to load spare parts catalog. Display names may not be available.');
        setSparePartsCatalog([]);
        console.error('Error fetching spare parts catalog:', fetchError.message);
      } else {
        setSparePartsCatalog(data as SparePart[]);
      }
    } catch (err: any) {
      setSparePartsError('Unexpected error occurred while loading spare parts catalog.');
      setSparePartsCatalog([]);
      console.error('Unexpected error fetching spare parts catalog:', err.message);
    } finally {
      setIsLoadingSpareParts(false);
    }
  }, []);


  useEffect(() => {
    if (!isAuthContextLoading) {
      if (currentUser) {
        fetchTasks();
        fetchSparePartsCatalog();
      } else {
        setTasks([]);
        setSparePartsCatalog([]);
        setIsLoadingTasks(false);
        setIsLoadingSpareParts(false);
      }
    }
  }, [fetchTasks, fetchSparePartsCatalog, currentUser, isAuthContextLoading]);

  const addTask = useCallback(
    async (
      taskData: Omit<
        Task,
        | 'id'
        | 'condition'
        | 'photo'
        | 'creator_id'
        | 'completeDate'
        | 'grade'
        | 'techNotes'
        | 'supervisorId'
        | 'supervisorNotes'
        | 'supervisorReviewPhoto'
        | 'supervisorConfirmationDate'
        | 'managerId'
        // | 'managerNotes' // Removed
        | 'managerConfirmationDate'
      >
    ) => {
      if (!currentUser || ![UserRole.SUPERVISOR, UserRole.CREATOR, UserRole.OWNER].includes(currentUser.role)) {
        alert('Only supervisors, creators, or owners can create tasks.');
        return;
      }

      const newTaskPayload = {
        ...taskData,
        condition: TaskStatus.PENDING,
        photo: [],
        creator_id: currentUser.id,
      };

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(newTaskPayload)
        .select()
        .single();

      if (insertError) {
        alert(`Failed to add task: ${insertError.message}`);
        console.error('Error adding task:', insertError.message, insertError);
      } else if (data) {
        await fetchTasks();
      }
    },
    [currentUser, fetchTasks]
  );

  const updateTask = useCallback(
    async (updatedTask: Task) => {
      if (!updatedTask.id) {
        alert('Update failed: Task ID is missing.');
        console.error('Update failed: Task ID is missing.');
        return;
      }

      const { id, ...updatePayload } = updatedTask;

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        alert(`Failed to update task: ${updateError.message}`);
        console.error('Error updating task:', updateError);
      } else if (data) {
        await fetchTasks();
      }
    },
    [fetchTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!currentUser || ![UserRole.SUPERVISOR, UserRole.CREATOR, UserRole.OWNER].includes(currentUser.role)) {
        alert('Only supervisors, creators, or owners can delete tasks.');
        return;
      }

      const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);

      if (deleteError) {
        alert(`Failed to delete task: ${deleteError.message}`);
        console.error('Error deleting task:', deleteError);
      } else {
        await fetchTasks();
      }
    },
    [currentUser, fetchTasks]
  );

  if (isAuthContextLoading || ((isLoadingTasks || isLoadingSpareParts) && currentUser)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Loading {APP_NAME}...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const combinedError = tasksError || sparePartsError;

  if (combinedError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <div className="text-xl font-semibold text-red-600">Error</div>
        <p className="text-slate-700 mt-2">{combinedError}</p>
        <Button onClick={() => {
          if (tasksError) fetchTasks();
          if (sparePartsError) fetchSparePartsCatalog();
        }} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const creatorEquivalentRoles = [UserRole.CREATOR, UserRole.OWNER];
  const supervisorAndUpRoles = [UserRole.SUPERVISOR, UserRole.CREATOR, UserRole.OWNER];
  const managerAndCreatorOwnerRoles = [UserRole.MANAGER, UserRole.CREATOR, UserRole.OWNER];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 mb-16 md:mb-0">
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/tasks" replace /></ProtectedRoute>} />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskList tasks={tasks} users={allUsers} sparePartsCatalog={sparePartsCatalog} />
            </ProtectedRoute>} 
          />
          <Route
            path="/task/new"
            element={
              <ProtectedRoute allowedRoles={supervisorAndUpRoles}>
                <TaskForm onSubmit={addTask} users={allUsers} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:id/edit"
            element={
              <ProtectedRoute>
                <TaskForm tasks={tasks} onSubmit={updateTask} users={allUsers} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:id"
            element={
              <ProtectedRoute>
                <TaskDetailView 
                  tasks={tasks} 
                  onUpdateTask={updateTask} 
                  onDeleteTask={deleteTask} 
                  users={allUsers} 
                  sparePartsCatalog={sparePartsCatalog} 
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.MANAGER, ...creatorEquivalentRoles]}>
                <SummaryView tasks={tasks} users={allUsers} sparePartsCatalog={sparePartsCatalog} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/awaiting-supervisor-confirmation"
            element={
              <ProtectedRoute allowedRoles={supervisorAndUpRoles}>
                <AwaitingSupervisorConfirmationList tasks={tasks} users={allUsers} sparePartsCatalog={sparePartsCatalog} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/awaiting-manager-confirmation"
            element={
              <ProtectedRoute allowedRoles={managerAndCreatorOwnerRoles}>
                <AwaitingManagerConfirmationList tasks={tasks} users={allUsers} sparePartsCatalog={sparePartsCatalog} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarView tasks={tasks} sparePartsCatalog={sparePartsCatalog} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={supervisorAndUpRoles}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
      <footer className="bg-slate-800 text-white text-center p-4 text-sm">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        {currentUser.role === UserRole.CREATOR || currentUser.role === UserRole.OWNER ? (
          <span className="block text-xs text-slate-400">{currentUser.role === UserRole.OWNER ? "Owner" : "Creator"} Mode Active</span>
        ) : null}
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;